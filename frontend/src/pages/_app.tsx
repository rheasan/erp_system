import '@/styles/globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import type { AppProps } from 'next/app'
import { Toaster } from 'react-hot-toast'

export default function App({ Component, pageProps }: AppProps) {
  	return (
		<ClerkProvider>
			<Toaster />
			<Component {...pageProps} />
		</ClerkProvider>
	)
}
