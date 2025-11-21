import { useState, useEffect, useRef } from 'react'
import useSWR from 'swr'
import { DollarSign, RefreshCw } from 'lucide-react'

const fetcher = (url) =>
    fetch(url).then(res => {
        if (!res.ok) throw new Error('API хатоси')
        return res.json()
    })

export const USDToUZSWidget = ({ position = 'bottom-right', refreshInterval = 60000 }) => {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [kurs, setKurs] = useState()
    const modalRef = useRef(null)

    const { data, mutate } = useSWR(
        'https://cbu.uz/uz/arkhiv-kursov-valyut/json/',
        fetcher,
        {
            refreshInterval,
            revalidateOnFocus: true,
        }
    )

    const usd = data?.find(i => i.Ccy === "USD")
    const apiRate = usd?.Rate

    useEffect(() => {
        if (apiRate) setKurs(apiRate)
    }, [apiRate])

    // Ekranning boshqa joyiga bosilganda modalni yopish
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                setIsModalOpen(false)
            }
        }

        if (isModalOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        } else {
            document.removeEventListener('mousedown', handleClickOutside)
        }

        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isModalOpen])

    const positionClasses = {
        'bottom-left': 'fixed left-6 bottom-6',
        'bottom-right': 'fixed left-6 bottom-6',
        'top-left': 'fixed left-6 top-6',
        'top-right': 'fixed right-6 top-6'
    }

    return (
        <div className={`${positionClasses[position]} z-50`}>
            {/* Widget */}
            <div
                className="bg-white shadow-lg rounded-xl p-1 cursor-pointer flex items-center space-x-1"
                onClick={() => setIsModalOpen(!isModalOpen)}
            >
                <DollarSign size={16} className="text-green-700" />
                <span className="text-green-700 font-semibold">
                    {kurs ? Number(kurs).toLocaleString("ru-RU") : '—'} <span className="text-sm">cўм</span>
                </span>
                <RefreshCw
                    className="w-4 h-4 text-gray-400 ml-2"
                    onClick={(e) => {
                        e.stopPropagation()
                        mutate()
                    }}
                />
            </div>

            {/* Modal */}
            {isModalOpen && data && (
                <div
                    ref={modalRef}
                    className="mt-2 w-72 max-h-80 overflow-y-auto bg-white border rounded-xl shadow-lg p-3"
                >
                    <h3 className="text-sm font-bold mb-2">Валюта курслари</h3>
                    {data.map(item => (
                        <div
                            key={item.Ccy}
                            className="flex justify-between mb-1 p-1 rounded hover:bg-gray-100 transition-colors"
                        >
                            <span className="font-medium">{item.Ccy} ({item.CcyNm_UZ})</span>
                            <div className="text-right">
                                <span>{Number(item.Rate).toLocaleString("ru-RU")} cўм</span>
                                {item.Diff && (
                                    <span className={`ml-2 text-xs ${item.Diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {item.Diff > 0 ? `+${item.Diff}` : item.Diff}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
