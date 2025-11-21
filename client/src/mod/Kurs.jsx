import { useState, useEffect, useContext } from 'react'
import useSWR from 'swr'
import { ContextData } from '../contextData/Context'
import { Settings, RefreshCw, DollarSign, Zap } from 'lucide-react'

const fetcher = (url) =>
    fetch(url).then((res) => {
        if (!res.ok) throw new Error('API хатоси')
        return res.json()
    })

export const USDToUZSWidget = ({ position = 'bottom-right', refreshInterval = 60000 }) => {
    const [open, setOpen] = useState(false)
    const [localKurs, setLocalKurs] = useState('')
    const [isRefreshing, setIsRefreshing] = useState(false)

    const { kurs, setKurs } = useContext(ContextData)

    const { data, mutate } = useSWR(
        'https://cbu.uz/uz/arkhiv-kursov-valyut/json/',
        fetcher,
        {
            refreshInterval,
            revalidateOnFocus: true,
            onSuccess: () => setIsRefreshing(false)
        }
    )

    // API дан USD топиш
    const usd = data?.find(i => i.Ccy === "USD")
    const apiRate = usd?.Rate

    // API янгиланса → контекстга ёзилади
    useEffect(() => {
        if (apiRate) {
            setKurs(apiRate)
        }
    }, [apiRate, setKurs])

    // Модалга очилганда local формага ёзиб қўйиш
    useEffect(() => {
        if (kurs) setLocalKurs(kurs)
    }, [kurs])

    const saveKurs = () => {
        setKurs(localKurs)
        setOpen(false)
    }

    const refreshKurs = async () => {
        setIsRefreshing(true)
        await mutate()
    }

    const positionClasses = {
        'bottom-left': 'fixed left-6 bottom-6',
        'bottom-right': 'fixed left-6 bottom-6',
        'top-left': 'fixed left-6 top-6',
        'top-right': 'fixed right-6 top-6'
    }

    return (
        <>
            {/* Ҳар доим кўринадиган тугма */}
            <div className={`${positionClasses[position]} z-50`}>
                <button
                    onClick={() => setOpen(true)}
                    className="group flex items-center gap-3 bg-gray-900 border border-gray-800 px-5 py-3 rounded-2xl shadow-xl hover:shadow-2xl active:scale-95 transition-all duration-300 hover:bg-gray-800"
                >
                    <div className="flex flex-col items-start">
                        <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-red-400" />
                            <span className="text-xs text-gray-300 font-medium">USD → UZS</span>
                        </div>
                        <span className="font-bold text-white text-lg">
                            {kurs ? Number(kurs).toLocaleString("ru-RU") : "—"}
                            <span className="text-red-400 text-sm ml-1">UZS</span>
                        </span>
                    </div>

                    <div className="rounded-full bg-red-500 p-2 group-hover:bg-red-600 transition-all duration-300">
                        <Settings className="w-4 h-4 text-white" />
                    </div>
                </button>
            </div>

            {/* Модал - Қора тема */}
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />

                    <div className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-6">
                        {/* Хедер */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-red-500 rounded-lg">
                                <Zap className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Курс Созламалари</h2>
                                <p className="text-sm text-gray-400">USD дан UZS га конвертация</p>
                            </div>
                        </div>

                        {/* Input бўлими */}
                        <div className="space-y-4">
                            <div>
                                <label className="block mb-2 text-sm text-gray-300 font-medium">
                                    Жорий курс (1 USD → UZS)
                                </label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="number"
                                        value={localKurs}
                                        onChange={(e) => setLocalKurs(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                                        placeholder="Курсни киритинг..."
                                    />
                                </div>
                            </div>

                            {/* Маълумот бўлими */}
                            <div className="bg-gray-800 rounded-xl p-4 space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400">Авто-янгиланиш:</span>
                                    <span className="text-white font-medium">
                                        {Math.round(refreshInterval / 1000)} сон
                                    </span>
                                </div>

                                {apiRate && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-400">API курси:</span>
                                        <span className="text-red-400 font-bold">{apiRate} UZS</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Ҳаркатлар */}
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-all duration-200"
                            >
                                Бекор қилиш
                            </button>

                            <button
                                onClick={refreshKurs}
                                disabled={isRefreshing}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 disabled:opacity-50"
                            >
                                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                Янгилаш
                            </button>

                            <button
                                onClick={saveKurs}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-200"
                            >
                                Сақлаш
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
