import { createContext, useContext, useState, Dispatch, SetStateAction } from 'react'

interface Loading {
	loading: boolean
	setLoading: Dispatch<SetStateAction<boolean>>
}

const loadingContext = createContext<Loading | null>(null)

export function LoadingProvider({ children }: React.PropsWithChildren) {
	const [loading, setLoading] = useState(false)
	const value = { loading, setLoading }
	return <loadingContext.Provider value={value}>{children}</loadingContext.Provider>
}

export function useLoading() {
	const context = useContext(loadingContext)
	if (!context) {
		throw new Error('useLoading must be used within LoadingProvider')
	}
	return context
}
