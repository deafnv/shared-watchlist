import { Skeleton } from "@mui/material";

export function loadingGlimmer(columns: number) {
  return (
    Array(8).fill('').map((item, index) => 
      <tr key={index}>
        {Array(columns).fill('').map((item1, index1) => 
          <td key={index1}>
            <Skeleton sx={{backgroundColor: 'grey.700'}} animation='wave' variant="rounded" width={index < 1 ? 480 : 120} height={40} />
          </td>
        )}
      </tr>
    )
  )
}