import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import { authorizeRequest } from '@/lib/authorize'

export default async function ChangeSeasonalError(req: NextApiRequest, res: NextApiResponse) {
	const authResult = authorizeRequest(req)
	if (typeof authResult !== 'string') return res.status(authResult.code).send(authResult.message)
	const { body, method } = req
	const { content, compare, id } = body //? mal_id for update

	if (method === 'POST') {
		try {
			await prisma.seasonalDetails.update({
				data: content,
				where: {
					[compare]: id
				}
			})

			return res.status(200).send('OK')
		} catch (error) {
			console.error(error)
			return res.status(500).send('Something went wrong')
		}
	}
	return res.status(405).send('Method not supported')
}
