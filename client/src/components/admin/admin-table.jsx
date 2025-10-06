import { AlertTriangleIcon, Trash2 } from 'lucide-react'
import { useContext } from 'react'
import { ContextData } from '../../context/ContextT'

export const AdminTable = ({ admins, handleDelete }) => {
  const { user } = useContext(ContextData)
  const isBoss = user._id
  return (
    <div className='bg-white rounded-lg shadow-md overflow-hidden'>
      <div className='h-full w-full pb-5 overflow-x-auto'>
        <table className='w-full text-sm sm:text-base'>
          <thead className='bg-blue-700 text-white'>
            <tr>
              <th className='py-3 px-2 sm:px-6 text-left'>Исм</th>
              <th className='py-3 px-2 sm:px-6 text-left'>Фамилия</th>
              <th className='py-3 px-2 sm:px-6 text-left'>Телефон рақам </th>
              {user.owner ? (
                <th className='py-3 px-2 sm:px-4 text-center'>Амаллар</th>
              ) : null}
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200'>
            {admins?.map(admin => (
              <tr
                key={admin._id}
                className={`transition-colors ${
                  admin._id == isBoss ? 'bg-amber-100' : 'hover:bg-blue-50'
                }`}
              >
                <td className='py-3 px-2 sm:px-6 text-gray-600'>
                  <div>{admin.firstName || '-'}</div>
                </td>
                <td className='py-3 px-2 sm:px-6 text-gray-600'>
                  {admin.lastName || '-'}
                </td>
                <td className='py-3 px-2 sm:px-6 font-medium text-blue-600 hover:underline'>
                  <div className='flex w-35 flex-col'>
                    <a className='w-full' href={`tel:${admin.phoneNumber}`}>
                      {admin.phoneNumber}
                    </a>
                  </div>
                </td>
                {user.owner ? (
                  <td className='py-3 px-2 sm:px-4 text-center'>
                    {!admin.owner ? (
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          handleDelete(admin._id)
                        }}
                        className='bg-red-500 cursor-pointer text-white rounded-md p-1.5 hover:bg-red-600 transition-colors'
                      >
                        <Trash2 className='text-white w-4 h-4' />
                      </button>
                    ) : (
                      <button disabled={true} className='cursor-not-allowed'>
                        <AlertTriangleIcon />
                      </button>
                    )}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
