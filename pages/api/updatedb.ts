import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';
import { Database } from '../../lib/database.types';

export default async function UpdateDatabase(
	req: NextApiRequest,
	res: NextApiResponse
) {
	const { body, method } = req;
	const { content, table, compare, id } = body;

	if (method === 'POST') {
		try {
			const supabase = createClient<Database>(
				'https://esjopxdrlewtpffznsxh.supabase.co',
				process.env.SUPABASE_SERVICE_API_KEY!
			);
      await supabase
        .from(table)
        .update(content)
        .eq(compare, id);
			
			return res.status(200).send('OK');
		} catch (error) {
			console.log(error);
      return res.status(500).send('Something went wrong');
		}
	}
	return res.status(405).send('Method not supported');
}
