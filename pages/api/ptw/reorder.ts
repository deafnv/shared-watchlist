import { NextApiRequest, NextApiResponse } from 'next'
import { google } from 'googleapis'
import { authorizeRequest } from '@/lib/authorize'

export default async function BatchUpdateSheet(req: NextApiRequest, res: NextApiResponse) {
	const authResult = authorizeRequest(req)
	if (typeof authResult !== 'string') return res.status(authResult.code).send(authResult.message)
	const { body, method } = req
	const { content, cells, type } = body

	if (!Array.isArray(content)) return res.status(400).send('Invalid content provided')
	let rowsToInsert
	switch (type) {
		case 'PTW':
			rowsToInsert = content.map((item) => {
				const { red, green, blue } = determineStatus(item)
				return {
					values: [
						{
							userEnteredValue: {
								stringValue: item.title
							},
							userEnteredFormat: {
								backgroundColor: {
									red,
									green,
									blue
								}
							}
						}
					]
				}
			})
			break
		case 'SEASONAL':
			rowsToInsert = content.map((item) => {
				const { red, green, blue } = determineStatus(item)
				return {
					values: [
						{
							userEnteredValue: {
								stringValue: item.title
							},
							userEnteredFormat: {
								backgroundColor: {
									red: 0.8,
									green: 0.8,
									blue: 0.8
								}
							}
						},
						{
							userEnteredFormat: {
								backgroundColor: {
									red,
									green,
									blue
								}
							}
						}
					]
				}
			})
			break
		default:
			return res.status(400)
	}

	let range = cells.split(':')
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
								rows: rowsToInsert
							}
						}
					]
				}
			})

			return res.status(200).send('OK')
		} catch (error) {
			console.error(error)
			return res.status(500).send(error)
		}
	}
	return res.status(405).send('Method not supported')
}

function determineStatus(item: any) {
	let red
	let green
	let blue
	switch (item.status) {
		case 'Watched':
			red = 0.5764706
			green = 0.76862746
			blue = 0.49019608
			break
		case 'Not loaded':
			red = 0.91764706
			green = 0.6
			blue = 0.6
			break
		case 'Loaded':
			red = 0.9764706
			green = 0.79607844
			blue = 0.6117647
			break
    case 'Not downloaded':
      red = 0.8
			green = 0.8
			blue = 0.8
			break
		case 'Not aired':
			red = 0
			green = 0
			blue = 0
			break
		default:
			red = 1
			green = 1
			blue = 1
	}
	return {red, green, blue}
}