import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';
import { Database } from '../../../lib/database.types';
import { google } from 'googleapis';
import axios from 'axios';


export default async function AddToCompleted(
	req: NextApiRequest,
	res: NextApiResponse
) {
	const { body, method } = req;
	const { content, id } = body;

	if (method === 'POST') {
    if (!content || !id) return res.status(400);
		try {
			const supabase = createClient<Database>(
				'https://esjopxdrlewtpffznsxh.supabase.co',
				process.env.SUPABASE_SERVICE_API_KEY!
			);
      const dataCompleted = await supabase
        .from('Completed')
        .select();
      if (!dataCompleted.data) return res.status(500).send('Failed to query database');

      let lastTitleCompletedID = dataCompleted.data.length;
      if (!dataCompleted.data[lastTitleCompletedID]?.title) lastTitleCompletedID--;

      const completedPTWRolled = content.filter((item: Database['public']['Tables']['PTW-Rolled']['Row']) => item.id != id);
      completedPTWRolled.push({ id: completedPTWRolled.length + 1, status: 'Empty', title: '' });
      const endRowIndex1 = content.length + 1;
      const cells = `N2:N${endRowIndex1}`;

      if (!Array.isArray(content))
        return res.status(400).send('Invalid content provided');
      const rowsToInsert = completedPTWRolled.map((item: Database['public']['Tables']['PTW-Rolled']['Row']) => {
        let red;
        let green;
        let blue;
        switch (item.status) {
          case 'Watched':
            red = 0.20392157;
            green = 0.65882355;
            blue = 0.3254902;
            break;
          case 'Not loaded':
            red = 0.91764706;
            green = 0.2627451;
            blue = 0.20784314;
            break;
          case 'Loaded':
            red = 0.9843137;
            green = 0.7372549;
            blue = 0.015686275;
            break;
          case 'Empty':
            red = 0.8;
            green = 0.8;
            blue = 0.8;
            break;
          default:
            red = 0;
            green = 0;
            blue = 0;
        }

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
        };
      });

      let range = cells.split(':');
      if (range.length < 2) return res.status(400).send('Invalid range provided');
      let startCell = range[0];
      let endCell = range[1];
      let startColumnIndex = startCell.charCodeAt(0) - 65;
      let startRowIndex = parseInt(startCell.substring(1)) - 1;
      let endColumnIndex = endCell.charCodeAt(0) - 64;
      let endRowIndex = parseInt(endCell.substring(1));

      const auth = await google.auth.getClient({
        credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS!),
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });
      const sheets = google.sheets({ version: 'v4', auth });

      await sheets.spreadsheets.batchUpdate({
				spreadsheetId: process.env.SHEET_ID,
				requestBody: {
					requests: [
						{
							updateCells: {
								fields:
									'userEnteredValue/stringValue, userEnteredFormat/backgroundColor',
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
			});

      const newIndex = lastTitleCompletedID! + 2;
      console.log(lastTitleCompletedID)
      const completedPTWTitle = content.filter((item: Database['public']['Tables']['PTW-Rolled']['Row']) => item.id == id)
      await sheets.spreadsheets.values.batchUpdate({
				spreadsheetId: process.env.SHEET_ID,
				requestBody: {
					data: [
						{
							range: `A${lastTitleCompletedID! + 3}:B${lastTitleCompletedID! + 3}`,
							majorDimension: 'ROWS',
							values: [[newIndex, completedPTWTitle[0].title]]
						}
					],
					valueInputOption: 'USER_ENTERED'
				}
			});
			
			return res.status(200).send('OK');
		} catch (error) {
			console.log(error);
      return res.status(500).send('Something went wrong');
		}
	}
	return res.status(405).send('Method not supported');
}