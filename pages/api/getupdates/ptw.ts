import { google } from "googleapis";
import { NextApiRequest, NextApiResponse } from "next";

export default async function GetUpdatesPTW(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  if (method === 'GET') {
    const auth = await google.auth.getClient({ credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS!), scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const sheets = google.sheets({ version: 'v4', auth });
    try {
      const resDataFilter = await sheets.spreadsheets.values.batchGetByDataFilter({
        spreadsheetId: process.env.SHEET_ID,
        requestBody: {
          dataFilters: [{
            a1Range: 'N1:N22'
          }],
        }
      });
    
      const lenOfAvailableTitles = resDataFilter.data.valueRanges?.[0].valueRange?.values?.length;
      const range = `Sheet1!N2:N${lenOfAvailableTitles}`;
      
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEET_ID,
        range
      });

      let idCounter = 0;
      const objectifiedRes = response.data.values?.map(item => {
        idCounter++;
        return {
          id: idCounter,
          title: item[0]
        }
      });

      return res.status(200).send(objectifiedRes);
    } catch (error) {
      console.log(error);
    }
  }
  return res.status(405).send("Method not supported");
}