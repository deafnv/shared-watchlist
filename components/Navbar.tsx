import Link from "next/link";

export default function Navbar({children}: React.PropsWithChildren) {
  const navLinks = [
    {
      name: 'Watched',
      route: '/'
    },
    {
      name: 'PTW',
      route: '/ptw'
    },
    {
      name: 'Current Season',
      route: '/seasonal'
    },
  ]
  
  return (
    <>
      <nav className="h-[60px] flex items-center justify-center gap-[20%] bg-black border-b-[1px]" style={{
        borderImage: 'linear-gradient(to right, rgb(218, 51, 190), rgb(191, 94, 255))',
        borderImageSlice: 1
      }}>
        <div className="flex items-center">
          <ul>
            {navLinks.map((link, index) => {
              return (
                <li className="inline mx-2" key={index}>
                  <Link href={link.route} className="p-4 rounded-lg hover:bg-pink-400 focus:bg-pink-400 transition-colors duration-200">{link.name}</Link>
                </li>
              )
            })}
          </ul>
          <Link href={`https://docs.google.com/spreadsheets/d/${process.env.SHEET_ID}`} target='_blank' className='link absolute right-8'>Go to Google Sheets ↗</Link>
        </div>
      </nav>

      { children }
    </>
  )
}