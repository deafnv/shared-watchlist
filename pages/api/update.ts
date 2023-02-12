export const config = {
  runtime: 'edge',
  regions: ['sin1'],
};

import axios from 'axios'
import { google } from 'googleapis'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function UpdateSheet(req: NextApiRequest, res: NextApiResponse) {
	const { body, method } = req
	const { content, cell, type, length } = body

	if (method === 'POST') {
		const auth = await google.auth.getClient({
			credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS!),
			scopes: ['https://www.googleapis.com/auth/spreadsheets']
		})
		const sheets = google.sheets({ version: 'v4', auth })

		if (type == 'MULTI') {
			try {
				await sheets.spreadsheets.values.update({
					spreadsheetId: process.env.SHEET_ID,
					range: cell,
					valueInputOption: 'USER_ENTERED',
					requestBody: {
						majorDimension: 'COLUMNS',
						values: [Array(length).fill(content)]
					}
				})
				console.log('multimode')
				return res.status(200).send('OK')
			} catch (error) {
				console.log(error)
			}
		}

		try {
			await sheets.spreadsheets.values.update({
				spreadsheetId: process.env.SHEET_ID,
				range: cell,
				valueInputOption: 'USER_ENTERED',
				requestBody: {
					values: [[content]]
				}
			})
			return res.status(200).send('OK')
		} catch (error) {
			console.log(error)
		}
	}
	return res.status(405).send('Method not supported')
}
