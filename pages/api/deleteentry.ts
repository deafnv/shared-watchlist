import { NextApiRequest, NextApiResponse } from 'next'
import { google } from 'googleapis'
import { PTWRolled, PTWCasual, Seasonal } from '@prisma/client' 
import { authorizeRequest } from '@/lib/authorize'

export default async function DeleteEntry(req: NextApiRequest, res: NextApiResponse) {
	const authResult = authorizeRequest(req)
	if (typeof authResult !== 'string') return res.status(authResult.code).send(authResult.message)
	const { body, method } = req
	const { content, id, tableId, type } = body
	console.log(id)

	if (method !== 'DELETE') return res.status(405).send('Method not supported')
	if (!content || !type || !(content instanceof Array)) //TODO: Check for id here, id can be 0/falsy
    return res.status(400).send('Invalid content provided')

	let cells
	let rowsToInsert

	if (type === 'PTW') {
		const toDeletePTWRolled = content.filter(
			(item: PTWRolled) => item.id != id
		)
		toDeletePTWRolled.push({ id: toDeletePTWRolled.length, status: 'Empty', title: '' })
		const endRowIndex1 = content.length + 1
		cells = `N2:N${endRowIndex1}`

		rowsToInsert = toDeletePTWRolled.map((item: PTWRolled) => {
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
	}
	else if (type === 'PTW_UNROLLED') {
		const toDeletePTWUnrolled = content.filter(
			(item: PTWCasual) => item.id != id
		)
		toDeletePTWUnrolled.push({ id: toDeletePTWUnrolled.length, title: '' })
		const { column, startRow } = getColumnRow(tableId)
		const endRowIndex1 = parseInt(startRow) + content.length - 1
		cells = `${column}${startRow}:${column}${endRowIndex1}`
		
		rowsToInsert = toDeletePTWUnrolled.map((item: PTWCasual) => {
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
					}
				]
			}
		})
	}
	else if (type === 'SEASONAL') {
		const completedSeasonal = content.filter(
			(item: Seasonal) => item.title != id //? id here is provided as entry title
		)
		completedSeasonal.push({ status: '', title: '', order: completedSeasonal.length + 1 })
		const endRowIndex1 = content.length + 1
		cells = `O2:P${endRowIndex1}`

		rowsToInsert = completedSeasonal.map((item: Seasonal) => {
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
	}

	if (!cells || !rowsToInsert) return res.status(500)

	let range = cells.split(':')
	if (range.length < 2) return res.status(400).send('Invalid range provided')
	let startCell = range[0]
	let endCell = range[1]
	let startColumnIndex = startCell.charCodeAt(0) - 65
	let startRowIndex = parseInt(startCell.substring(1)) - 1
	let endColumnIndex = endCell.charCodeAt(0) - 64
	let endRowIndex = parseInt(endCell.substring(1))

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
		console.log(error)
		return res.status(500).send(error)
	}
}

function getColumnRow(tableId: string) {
	let tableName: { column: string, startRow: string }
	switch (tableId) {
		case 'casual':
			tableName = { column: 'L', startRow: '2' }
			break
		case 'noncasual':
			tableName = { column: 'M', startRow: '2' }
			break
		case 'movies':
			tableName = { column: 'L', startRow: '22' }
			break
		default:
			tableName = { column: 'L', startRow: '2' }
			break
	}
	return tableName
}

function determineStatus(item: any) {
	let red
	let green
	let blue
	switch (item.status) {
		case 'Watched':
			red = 0.20392157
			green = 0.65882355
			blue = 0.3254902
			break
		case 'Not loaded':
			red = 0.91764706
			green = 0.2627451
			blue = 0.20784314
			break
		case 'Loaded':
			red = 0.9843137
			green = 0.7372549
			blue = 0.015686275
			break
		case 'Empty':
			red = 0.8
			green = 0.8
			blue = 0.8
			break
		default:
			red = 0
			green = 0
			blue = 0
	}
	return { red, green, blue }
}