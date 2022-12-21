import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

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
        </div>
      </nav>

      { children }
    </>
  )
}