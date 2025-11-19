import { useState, useContext, useMemo } from 'react'
import useSWR from 'swr'
import { motion, AnimatePresence } from 'framer-motion'
import {
    X,
    User,
    MapPin,
    ChevronLeft,
    Package,
    Search,
    AlertCircle,
    Box,
    Ruler,
    Scale,
    Layers,
    DollarSign,
    BarChart3,
    TrendingUp,
    Eye,
    Edit,
    Trash2,
    Loader2,
    Send,
    Plus
} from 'lucide-react'
import Fetch from '../middlewares/fetcher'
import { ContextData } from '../contextData/Context'
import { LoadingState } from '../components/loading-state'

export const ClientProductsView = () => {
    const { data, error, isLoading, mutate } = useSWR('/products/clients', Fetch, {
        refreshInterval: 5000,
        revalidateOnFocus: true,
        revalidateOnReconnect: true
    })
    const { user } = useContext(ContextData)

    const [searchPhone, setSearchPhone] = useState('')
    const [searchName, setSearchName] = useState('')
    const [selectedClient, setSelectedClient] = useState(null)
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [editingProduct, setEditingProduct] = useState(null)
    const [loading, setLoading] = useState(null)

    // Qarz to'lash state lari
    const [debtUZ, setDebtUZ] = useState(0)
    const [debtEN, setDebtEN] = useState(0)
    const [debtLUZ, setDebtLUZ] = useState(false)
    const [debtLEN, setDebtLEN] = useState(false)

    const clients = (data?.data.data || []).filter(u => u.clietn === false)

    // Filter clients
    const filteredClients = useMemo(() => {
        return clients.filter(client => {
            const phoneMatch = client.phoneNumber
                ?.toLowerCase()
                .includes(searchPhone.toLowerCase())
            const nameMatch = client.name
                ?.toLowerCase()
                .includes(searchName.toLowerCase())

            return phoneMatch && nameMatch
        })
    }, [clients, searchPhone, searchName])

    // Calculate product balances by unit for a single client
    const calculateClientProductBalances = (products) => {
        const balances = {}
        let totalReadyProducts = 0
        let totalRawProducts = 0
        let totalValueUZ = 0
        let totalValueEN = 0

        products.forEach(product => {
            const unit = product.unit || 'дона'
            const title = product.title
            const stock = Number(product.stock) || 0
            const price = Number(product.price) || 0
            const priceType = product.priceType || 'uz'

            // Product balances by unit
            if (!balances[title]) {
                balances[title] = {}
            }
            if (!balances[title][unit]) {
                balances[title][unit] = 0
            }
            balances[title][unit] += stock

            // Count ready/raw products
            if (product.ready) {
                totalReadyProducts += 1
            } else {
                totalRawProducts += 1
            }

            // Calculate total value
            if (priceType === 'uz') {
                totalValueUZ += price * stock
            } else {
                totalValueEN += price * stock
            }
        })

        return {
            balances,
            totalReadyProducts,
            totalRawProducts,
            totalValueUZ,
            totalValueEN,
            totalProducts: products.length
        }
    }

    // Calculate overall balances for all products (aggregated by unit)
    const calculateOverallBalances = (products) => {
        const overallBalances = {}

        products.forEach(product => {
            const unit = product.unit || 'дона'
            const stock = Number(product.stock) || 0

            if (!overallBalances[unit]) {
                overallBalances[unit] = 0
            }
            overallBalances[unit] += stock
        })

        return overallBalances
    }

    // Get unit icon
    const getUnitIcon = (unit) => {
        switch (unit) {
            case 'кг':
                return <Scale size={16} className="text-orange-500" />
            case 'метр':
                return <Ruler size={16} className="text-blue-500" />
            case 'литр':
                return <Layers size={16} className="text-green-500" />
            case 'м²':
                return <Box size={16} className="text-purple-500" />
            case 'м³':
                return <Box size={16} className="text-indigo-500" />
            default:
                return <Package size={16} className="text-gray-500" />
        }
    }

    // Format currency
    const formatCurrency = (amount, currency = 'UZS') => {
        return new Intl.NumberFormat('uz-UZ', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0
        }).format(amount)
    }

    // Handle product edit
    const handleEdit = (product) => {
        setEditingProduct({ ...product })
    }

    // Handle product update
    const handleUpdate = async () => {
        if (!editingProduct) return

        try {
            setLoading(editingProduct._id)
            await Fetch.put(`/products/${editingProduct._id}`, editingProduct)
            setEditingProduct(null)
            mutate()
        } catch (err) {
            console.error('Update error:', err)
            alert('❌ Сақлашда хатолик юз берди')
        } finally {
            setLoading(null)
        }
    }

    // Handle product delete
    const handleDelete = async (productId) => {
        const confirmed = window.confirm('❌ Сиз ростдан ҳам бу маҳсулотни ўчирмоқчимисиз?')
        if (!confirmed) return

        try {
            setLoading(productId)
            await Fetch.delete(`/products/${productId}`)
            mutate()
        } catch (err) {
            console.error('Delete error:', err)
            alert('❌ Маҳсулотни ўчиришда хатолик юз берди')
        } finally {
            setLoading(null)
        }
    }

    // Handle input change for editing
    const handleInputChange = (field, value) => {
        setEditingProduct(prev => ({
            ...prev,
            [field]: value
        }))
    }

    // Qarz to'lash funksiyasi (so'm)
    const handlePayDebtUZ = async () => {
        if (!selectedClient) {
            alert('❌ Мижоз танланмаган')
            return
        }

        if (!debtUZ || debtUZ <= 0) {
            alert('❌ Тўлов суммасини киритинг')
            return
        }

        try {
            setDebtLUZ(true)
            console.log('Sending request to server...', {
                clientId: selectedClient._id,
                uz: Number(debtUZ)
            })

            const response = await Fetch.post("/products/pay", {
                clientId: selectedClient._id,
                uz: Number(debtUZ)
            })

            console.log('Server response:', response)

            setDebtUZ(0)
            mutate()
            alert("✅ Қарз муваффақиятли тўланди")
        } catch (error) {
            console.error('Pay debt error:', error)
            console.error('Error details:', error.response?.data || error.message)
            alert("❌ Тўловда хатолик юз берди: " + (error.response?.data?.message || error.message))
        } finally {
            setDebtLUZ(false)
        }
    }

    // Qarz to'lash funksiyasi (dollar)
    const handlePayDebtEN = async () => {
        if (!selectedClient) {
            alert('❌ Мижоз танланмаган')
            return
        }

        if (!debtEN || debtEN <= 0) {
            alert('❌ Тўлов суммасини киритинг')
            return
        }

        try {
            setDebtLEN(true)
            console.log('Sending request to server...', {
                clientId: selectedClient._id,
                en: Number(debtEN)
            })

            const response = await Fetch.post("/products/pay", {
                clientId: selectedClient._id,
                en: Number(debtEN)
            })

            console.log('Server response:', response)

            setDebtEN(0)
            mutate()
            alert("✅ Қарз муваффақиятли тўланди")
        } catch (error) {
            console.error('Pay debt error:', error)
            console.error('Error details:', error.response?.data || error.message)
            alert("❌ Тўловда хатолик юз берди: " + (error.response?.data?.message || error.message))
        } finally {
            setDebtLEN(false)
        }
    }

    if (isLoading) {
        return (
            <div className='min-h-screen flex justify-center items-center'>
                <LoadingState />
            </div>
        )
    }

    if (error)
        return (
            <div className='min-h-screen flex items-center justify-center'>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className='text-center p-8 bg-red-50 rounded-2xl border border-red-200 max-w-md'
                >
                    <AlertCircle className='mx-auto text-red-500 mb-4' size={48} />
                    <h3 className='text-lg font-semibold text-red-800 mb-2'>
                        Юклашда хатолик
                    </h3>
                    <p className='text-red-600'>
                        Манба маълумотларини юклашда хатолик юз берди. Илтимос, қайта уриниб кўринг.
                    </p>
                </motion.div>
            </div>
        )

    return (
        <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-6'>
            <div className='mx-auto space-y-6'>
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className='bg-white rounded-2xl shadow-lg p-6 border border-gray-200'
                >
                    <div className='flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4'>
                        <div className='flex items-center gap-4'>
                            {selectedClient ? (
                                <motion.button
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    onClick={() => setSelectedClient(null)}
                                    className='flex items-center gap-2 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-all duration-300'
                                >
                                    <ChevronLeft size={20} />
                                    Орқага
                                </motion.button>
                            ) : (
                                <div className='bg-gradient-to-r from-green-500 to-emerald-500 p-3 rounded-xl shadow-lg'>
                                    <User className='text-white' size={28} />
                                </div>
                            )}
                            <div>
                                <h1 className='text-2xl md:text-3xl font-bold text-gray-800'>
                                    {selectedClient
                                        ? `${selectedClient.name} маҳсулотлари`
                                        : 'Манба ва маҳсулотлар'}
                                </h1>
                                <p className='text-gray-600 mt-1'>
                                    {selectedClient
                                        ? `${selectedClient.products?.length || 0} та маҳсулот топилди`
                                        : `${filteredClients.length} та мижоз топилди`}
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Search Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className='bg-white rounded-2xl shadow-lg p-6 border border-gray-200'
                >
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div className='relative'>
                            <Search
                                className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
                                size={20}
                            />
                            <input
                                type='text'
                                placeholder='Телефон рақам...'
                                value={searchPhone}
                                onChange={e => setSearchPhone(e.target.value)}
                                className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 bg-gray-50'
                            />
                        </div>

                        <div className='relative'>
                            <User
                                className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
                                size={20}
                            />
                            <input
                                type='text'
                                placeholder='Мижоз номи...'
                                value={searchName}
                                onChange={e => setSearchName(e.target.value)}
                                className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 bg-gray-50'
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Qarz to'lash section */}
                {selectedClient && (
                    <div className='bg-white rounded-2xl shadow-lg p-6 border border-gray-200'>
                        <h3 className='text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2'>
                            <Plus size={20} className='text-purple-500' />
                            Қарзни ёпиш
                        </h3>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            {/* So'mda to'lash */}
                            {selectedClient.debtUZ > 0 && <div className='space-y-3 relative'>
                                <label className='text-sm font-medium text-gray-700'>
                                    Сўмда тўлаш:
                                </label>
                                <input
                                    type='text'
                                    placeholder="Ёпилаётган қиймат"
                                    value={debtUZ}
                                    onChange={e => {
                                        const value = e.target.value;
                                        if (/^\d*$/.test(value)) {
                                            setDebtUZ(value);
                                        }
                                    }}
                                    className='w-full pl-2 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 bg-gray-50'
                                />
                                {debtUZ > 0 && (
                                    <button
                                        onClick={handlePayDebtUZ}
                                        disabled={debtLUZ}
                                        className='absolute right-4 top-9 z-10 cursor-pointer hover:bg-blue-500 hover:text-white rounded p-1 transition-colors duration-200'
                                    >
                                        {debtLUZ ? <Loader2 className='animate-spin' size={20} /> : <Send size={20} />}
                                    </button>
                                )}
                            </div>
                            }
                            {/* Dollarda to'lash */}
                            {selectedClient.debtEN > 0 && <div className='space-y-3 relative'>
                                <label className='text-sm font-medium text-gray-700'>
                                    Долларда тўлаш:
                                </label>
                                <input
                                    type='text'
                                    placeholder="Ёпилаётган қиймат"
                                    value={debtEN}
                                    onChange={e => {
                                        const value = e.target.value;
                                        if (/^\d*$/.test(value)) {
                                            setDebtEN(value);
                                        }
                                    }}
                                    className='w-full pl-2 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 bg-gray-50'
                                />
                                {debtEN > 0 && (
                                    <button
                                        onClick={handlePayDebtEN}
                                        disabled={debtLEN}
                                        className='absolute right-4 top-9 z-10 cursor-pointer hover:bg-blue-500 hover:text-white rounded p-1 transition-colors duration-200'
                                    >
                                        {debtLEN ? <Loader2 className='animate-spin' size={20} /> : <Send size={20} />}
                                    </button>
                                )}
                            </div>}
                        </div>
                    </div>
                )}

                {!selectedClient && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        {filteredClients.length === 0 ? (
                            <div className='bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-200'>
                                <User className='mx-auto text-gray-400 mb-4' size={64} />
                                <h3 className='text-xl font-semibold text-gray-600 mb-2'>
                                    Манба топилмади
                                </h3>
                                <p className='text-gray-500 mb-6'>
                                    Қидирув шартларингизга мос келувчи Манба мавжуд эмас
                                </p>
                                <button
                                    onClick={() => {
                                        setSearchPhone('')
                                        setSearchName('')
                                    }}
                                    className='text-blue-500 hover:text-blue-700 font-semibold'
                                >
                                    Филтрни тозалаш
                                </button>
                            </div>
                        ) : (
                            <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
                                {filteredClients.map((client, index) => {
                                    const productBalances = calculateClientProductBalances(client.products || [])

                                    return (
                                        <motion.div
                                            key={client._id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            onClick={() => setSelectedClient(client)}
                                            className={`${(client.debtEN && client.debtEN > 0) || (client.debtUZ && client.debtUZ > 0) ? "bg-red-200" : "bg-white"} rounded-2xl shadow-lg p-6 border border-gray-200 hover:shadow-xl hover:border-green-300 transition-all duration-300 cursor-pointer group`}
                                        >
                                            <div className='flex items-start justify-between mb-4'>
                                                <div className='flex items-center gap-3'>
                                                    <div className='bg-gradient-to-r from-green-500 to-emerald-500 p-3 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300'>
                                                        <User className='text-white' size={24} />
                                                    </div>
                                                    <div>
                                                        <h3 className='font-bold text-lg text-gray-800'>
                                                            {client.name || 'Номаълум'}
                                                        </h3>
                                                        <p className='text-gray-600 text-sm'>
                                                            {client.phoneNumber}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className='text-right'>
                                                    <div className='flex items-center gap-1 text-blue-600 font-semibold text-lg'>
                                                        <Package size={18} />
                                                        <span>{client.productCount || 0}</span>
                                                    </div>
                                                    <div className='text-xs text-gray-500'>маҳсулот</div>
                                                </div>
                                            </div>

                                            <div className='flex items-center gap-2 text-sm text-gray-600 mb-3'>
                                                <MapPin size={16} />
                                                <span className='truncate'>
                                                    {client.address || 'Манзил кўрсатилмаган'}
                                                </span>
                                            </div>

                                            {/* Qarz ma'lumotlari */}
                                            {(client.debtUZ || client.debtEN) && (
                                                <div className='mb-3 p-3 bg-red-50 rounded-lg border border-red-200'>
                                                    <h4 className='text-sm font-semibold text-red-700 mb-1'>
                                                        Қарзларим:
                                                    </h4>
                                                    {client.debtUZ && (
                                                        <div className='text-sm text-red-600'>
                                                            Сўм: {formatCurrency(client.debtUZ)}
                                                        </div>
                                                    )}
                                                    {client.debtEN && (
                                                        <div className='text-sm text-red-600'>
                                                            Доллар: ${client.debtEN.toLocaleString()}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Product Balances Summary */}
                                            <div className='mb-4'>
                                                <h4 className='text-sm font-semibold text-gray-700 mb-2'>
                                                    Маҳсулот қолдиқлари:
                                                </h4>
                                                <div className='space-y-1 max-h-20 overflow-y-auto'>
                                                    {Object.entries(productBalances.balances).slice(0, 3).map(([productName, units]) => (
                                                        <div key={productName} className='flex items-center gap-2 text-xs'>
                                                            <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                                                            <span className='font-medium text-gray-800 truncate'>{productName}</span>
                                                            <span className='text-gray-600'>
                                                                {Object.entries(units).map(([unit, qty]) =>
                                                                    `${qty} ${unit}`
                                                                ).join(', ')}
                                                            </span>
                                                        </div>
                                                    ))}
                                                    {Object.keys(productBalances.balances).length > 3 && (
                                                        <div className='text-xs text-blue-500 font-medium'>
                                                            + {Object.keys(productBalances.balances).length - 3} та бошқа маҳсулот
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className='flex justify-between items-center pt-4 border-t border-gray-100'>
                                                <span className='text-sm text-gray-500'>Умумий маҳсулот:</span>
                                                <span className='font-bold text-blue-600'>
                                                    {client.products?.length || 0} та
                                                </span>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        )}
                    </motion.div>
                )}

                {selectedClient && (() => {
                    const clientStats = calculateClientProductBalances(selectedClient.products || [])
                    const overallBalances = calculateOverallBalances(selectedClient.products || [])

                    return (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            {/* Client Overview Section */}
                            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6'>
                                {/* Client Info Card */}
                                <div className='bg-white rounded-2xl shadow-lg p-6 border border-gray-200'>
                                    <div className='flex items-center gap-3 mb-4'>
                                        <div className='bg-gradient-to-r from-green-500 to-emerald-500 p-3 rounded-xl'>
                                            <User className='text-white' size={24} />
                                        </div>
                                        <div>
                                            <h2 className='text-xl font-bold text-gray-800'>{selectedClient.name}</h2>
                                            <p className='text-gray-600'>{selectedClient.phoneNumber}</p>
                                        </div>
                                    </div>

                                    <div className='space-y-3'>
                                        <div className='flex items-center gap-2 text-sm text-gray-600'>
                                            <MapPin size={16} />
                                            <span>{selectedClient.address || 'Манзил кўрсатилмаган'}</span>
                                        </div>

                                        {/* Qarz ma'lumotlari */}
                                        {(selectedClient.debtUZ || selectedClient.debtEN) && (
                                            <div className='p-3 bg-red-50 rounded-lg border border-red-200'>
                                                <p className='text-sm font-semibold text-red-700 mb-1'>Қарзлари:</p>
                                                {selectedClient.debtUZ && (
                                                    <div className={`flex items-center gap-2 text-sm ${selectedClient.debtUZ < 0 ? "text-green-600" : "text-red-600"}`}>
                                                        <TrendingUp size={16} />
                                                        <span>Қарз: {formatCurrency(selectedClient.debtUZ)}</span>
                                                    </div>
                                                )}
                                                {selectedClient.debtEN && (
                                                    <div className={`flex items-center gap-2 text-sm ${selectedClient.debtEN < 0 ? "text-green-600" : "text-red-600"}`}>
                                                        <DollarSign size={16} />
                                                        <span>Қарз ($): ${selectedClient.debtEN.toLocaleString()}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Statistics Card */}
                                <div className='bg-white rounded-2xl shadow-lg p-6 border border-gray-200'>
                                    <h3 className='text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2'>
                                        <BarChart3 size={20} className='text-blue-500' />
                                        Статистика
                                    </h3>
                                    <div className='space-y-3'>
                                        <div className='flex justify-between items-center'>
                                            <span className='text-gray-600'>Жами маҳсулот:</span>
                                            <span className='font-bold text-blue-600'>{clientStats.totalProducts} та</span>
                                        </div>
                                        <div className='flex justify-between items-center'>
                                            <span className='text-gray-600'>Тайёр маҳсулот:</span>
                                            <span className='font-bold text-green-600'>{clientStats.totalReadyProducts} та</span>
                                        </div>
                                        <div className='flex justify-between items-center'>
                                            <span className='text-gray-600'>Хом ашё:</span>
                                            <span className='font-bold text-yellow-600'>{clientStats.totalRawProducts} та</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Overall Balances Card */}
                                <div className='bg-white rounded-2xl shadow-lg p-6 border border-gray-200'>
                                    <h3 className='text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2'>
                                        <Package size={20} className='text-purple-500' />
                                        Умумий қолдиқ
                                    </h3>
                                    <div className='space-y-2'>
                                        {Object.entries(overallBalances).map(([unit, quantity]) => (
                                            <div key={unit} className='flex justify-between items-center'>
                                                <div className='flex items-center gap-2'>
                                                    {getUnitIcon(unit)}
                                                    <span className='text-gray-600 capitalize'>{unit}:</span>
                                                </div>
                                                <span className='font-bold text-gray-800'>{quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Products Table */}
                            {selectedClient.products?.length === 0 ? (
                                <div className='bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-200'>
                                    <Package className='mx-auto text-gray-400 mb-4' size={64} />
                                    <h3 className='text-xl font-semibold text-gray-600 mb-2'>
                                        Маҳсулотлар топилмади
                                    </h3>
                                    <p className='text-gray-500'>
                                        Ушбу мижоз учун ҳеч қандай маҳсулот топилмади.
                                    </p>
                                </div>
                            ) : (
                                <div className='bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden'>
                                    <div className='overflow-x-auto'>
                                        <table className='w-full'>
                                            <thead className='bg-gradient-to-r from-gray-50 to-gray-100'>
                                                <tr>
                                                    <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>
                                                        Маҳсулот номи
                                                    </th>
                                                    <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>
                                                        ID
                                                    </th>
                                                    <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>
                                                        Миқдор
                                                    </th>
                                                    <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>
                                                        Нарх
                                                    </th>
                                                    <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>
                                                        Ҳолати
                                                    </th>
                                                    <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>
                                                        Сана
                                                    </th>
                                                    <th className='px-6 py-4 text-center text-sm font-semibold text-gray-700'>
                                                        Амалиёт
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className='divide-y divide-gray-200'>
                                                {selectedClient.products?.map((product, index) => (
                                                    <motion.tr
                                                        key={product._id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        className='hover:bg-blue-50 transition-colors duration-200'
                                                    >
                                                        <td className='px-6 py-4'>
                                                            <div className='flex items-center gap-3'>
                                                                <div className='bg-gradient-to-r from-blue-500 to-indigo-500 p-2 rounded-lg'>
                                                                    {getUnitIcon(product.unit)}
                                                                </div>
                                                                <div>
                                                                    <div className='font-medium text-gray-800'>
                                                                        {product.title}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td className='px-6 py-4 text-sm text-gray-600'>
                                                            {product.ID}
                                                        </td>

                                                        <td className='px-6 py-4'>
                                                            {editingProduct?._id === product._id ? (
                                                                <input
                                                                    type='number'
                                                                    value={editingProduct.stock}
                                                                    onChange={(e) => handleInputChange('stock', e.target.value)}
                                                                    className='w-24 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none'
                                                                />
                                                            ) : (
                                                                <div className='font-bold text-blue-600'>
                                                                    {product.stock} {product.unit}
                                                                </div>
                                                            )}
                                                        </td>

                                                        <td className='px-6 py-4'>
                                                            {user.role === 'admin' ? (
                                                                editingProduct?._id === product._id ? (
                                                                    <div className='flex items-center gap-2'>
                                                                        <input
                                                                            type='number'
                                                                            value={editingProduct.price}
                                                                            onChange={(e) => handleInputChange('price', e.target.value)}
                                                                            className='w-32 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none'
                                                                        />
                                                                        <select
                                                                            value={editingProduct.priceType}
                                                                            onChange={(e) => handleInputChange('priceType', e.target.value)}
                                                                            className='border border-gray-300 rounded-lg px-2 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none'
                                                                        >
                                                                            <option value='uz'>сўм</option>
                                                                            <option value='en'>$</option>
                                                                        </select>
                                                                    </div>
                                                                ) : (
                                                                    <div className='font-bold text-green-600'>
                                                                        {product.price?.toLocaleString()} {product.priceType === 'uz' ? 'сўм' : '$'}
                                                                    </div>
                                                                )
                                                            ) : (
                                                                <div className='text-gray-400'>---</div>
                                                            )}
                                                        </td>

                                                        <td className='px-6 py-4'>
                                                            {editingProduct?._id === product._id ? (
                                                                <select
                                                                    value={editingProduct.ready}
                                                                    onChange={(e) => handleInputChange('ready', e.target.value === 'true')}
                                                                    className='border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none'
                                                                >
                                                                    <option value={true}>Тайёр</option>
                                                                    <option value={false}>Хом ашё</option>
                                                                </select>
                                                            ) : (
                                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${product.ready
                                                                    ? 'bg-green-100 text-green-800 border-green-200'
                                                                    : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                                                    }`}>
                                                                    {product.ready ? 'Тайёр' : 'Хом ашё'}
                                                                </div>
                                                            )}
                                                        </td>

                                                        <td className='px-6 py-4 text-sm text-gray-600'>
                                                            {new Date(product.createdAt).toLocaleDateString()}
                                                        </td>

                                                        <td className='px-6 py-4'>
                                                            <div className='flex items-center justify-center gap-2'>
                                                                <motion.button
                                                                    whileHover={{ scale: 1.05 }}
                                                                    whileTap={{ scale: 0.95 }}
                                                                    onClick={() => setSelectedProduct(product)}
                                                                    className='flex items-center gap-2 bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200'
                                                                >
                                                                    <Eye size={16} />
                                                                </motion.button>

                                                                {user.role === 'admin' && (
                                                                    <>
                                                                        <motion.button
                                                                            whileHover={{ scale: 1.05 }}
                                                                            whileTap={{ scale: 0.95 }}
                                                                            onClick={() => handleDelete(product._id)}
                                                                            disabled={loading === product._id}
                                                                            className='flex items-center gap-2 bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors duration-200'
                                                                        >
                                                                            {loading === product._id ? (
                                                                                <Loader2 className='animate-spin' size={16} />
                                                                            ) : (
                                                                                <Trash2 size={16} />
                                                                            )}
                                                                        </motion.button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )
                })()}
            </div>

            {/* Product Detail Modal */}
            <AnimatePresence>
                {selectedProduct && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedProduct(null)}
                        className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4'
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className='bg-white w-full max-w-md rounded-3xl shadow-2xl relative'
                        >
                            <button
                                onClick={() => setSelectedProduct(null)}
                                className='absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors duration-200'
                            >
                                <X size={20} />
                            </button>

                            <div className='p-6'>
                                <div className='text-center mb-6'>
                                    <div className='bg-gradient-to-r from-blue-500 to-indigo-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg'>
                                        {getUnitIcon(selectedProduct.unit)}
                                    </div>
                                    <h2 className='text-xl font-bold text-gray-800'>
                                        {selectedProduct.title}
                                    </h2>
                                    <p className='text-gray-600'>ID: {selectedProduct.ID}</p>
                                </div>

                                <div className='space-y-4'>
                                    <div className='flex justify-between items-center p-3 bg-blue-50 rounded-xl'>
                                        <span className='text-gray-600'>Миқдор:</span>
                                        <span className='font-bold text-lg text-blue-600'>
                                            {selectedProduct.stock} {selectedProduct.unit}
                                        </span>
                                    </div>

                                    {user.role === 'admin' && selectedProduct.price > 0 && (
                                        <div className='flex justify-between items-center p-3 bg-green-50 rounded-xl'>
                                            <span className='text-gray-600'>Нархи:</span>
                                            <span className='font-bold text-lg text-green-600'>
                                                {selectedProduct.price?.toLocaleString()} {selectedProduct.priceType === 'uz' ? 'сўм' : '$'}
                                            </span>
                                        </div>
                                    )}

                                    <div className='flex justify-between items-center p-3 bg-purple-50 rounded-xl'>
                                        <span className='text-gray-600'>Нарх тури:</span>
                                        <span className='font-semibold text-purple-600'>
                                            {selectedProduct.priceType === 'uz' ? 'Сўм' : 'Доллар'}
                                        </span>
                                    </div>

                                    <div className='flex justify-between items-center p-3 bg-yellow-50 rounded-xl'>
                                        <span className='text-gray-600'>Ҳолати:</span>
                                        <span className={`font-semibold ${selectedProduct.ready ? 'text-green-600' : 'text-yellow-600'
                                            }`}>
                                            {selectedProduct.ready ? 'Тайёр' : 'Хом ашё'}
                                        </span>
                                    </div>

                                    <div className='flex justify-between items-center p-3 bg-gray-50 rounded-xl'>
                                        <span className='text-gray-600'>Қўшилган:</span>
                                        <span className='text-sm text-gray-600'>
                                            {new Date(selectedProduct.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}