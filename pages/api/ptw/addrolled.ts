import { NextApiRequest, NextApiResponse } from 'next'
import { google } from 'googleapis'
import { authorizeRequest } from '@/lib/authorize'

interface Content {
	deleteStep: {
		range: string
		content: Array<string>
	}
	addStep: {
		cell: string
		content: string
	}
}

export default async function BatchUpdateSheet(req: NextApiRequest, res: NextApiResponse) {
	const authResult = authorizeRequest(req)
	if (typeof authResult !== 'string') return res.status(authResult.code).send(authResult.message)
	const { body, method } = req
	const { deleteStep, addStep } = body

	let range = addStep.cell.split(':')
	if (range.length < 2) return res.status(400).send('Invalid range provided')
	let startCell = range[0]
	let endCell = range[1]
	let startColumnIndex = startCell.charCodeAt(0) - 65
	let startRowIndex = parseInt(startCell.substring(1)) - 1
	let endColumnIndex = endCell.charCodeAt(0) - 64
	let endRowIndex = parseInt(endCell.substring(1))

	if (method === 'POST') {
		const auth = await google.auth.getClient({
			credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS!),
			scopes: ['https://www.googleapis.com/auth/spreadsheets']
		})
		const sheets = google.sheets({ version: 'v4', auth })
		try {
			await sheets.spreadsheets.values.batchUpdate({
				spreadsheetId: process.env.SHEET_ID,
				requestBody: {
					data: [
						{
							range: deleteStep.range,
							majorDimension: 'COLUMNS',
							values: [deleteStep.content]
						}
					],
					valueInputOption: 'USER_ENTERED'
				}
			})

			await sheets.spreadsheets.batchUpdate({
				spreadsheetId: process.env.SHEET_ID,
				requestBody: {
					requests: [
						{
							updateCells: {
								fields: 'userEnteredValue/stringValue, userEnteredFormat/backgroundColor',
								range: {
									sheetId: 0,
									startRowIndex,
									endRowIndex,
									startColumnIndex,
									endColumnIndex
								},
								rows: [
									{
										values: [
											{
												userEnteredValue: {
													stringValue: addStep.content
												},
												userEnteredFormat: {
													backgroundColor: {
														red: 0.91764706,
														green: 0.2627451,
														blue: 0.20784314
													}
												}
											}
										]
									}
								]
							}
						}
					]
				}
			})

			return res.status(200).send('OK')
		} catch (error) {
			console.log(error)
			return res.status(500).send(error)
		}
	}
	return res.status(405).send('Method not supported')
}
