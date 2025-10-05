import { useState, useEffect } from 'react'
import { Plus, Minus, Save, Search, X } from 'lucide-react'
import Fetch from '../middlewares/fetcher'
import { useContext } from 'react'
import { ContextData } from '../Context/Context'

export const AddNewOrder = ({ isOpen, onClose }) => {
  const { user } = useContext(ContextData)
  if (!isOpen) return null

  const [products, setProducts] = useState([])
  const [selectedProducts, setSelectedProducts] = useState([])
  const [customer, setCustomer] = useState(user._id)
  const [status, setStatus] = useState('Янги')
  const [payType, setPayType] = useState('--')
  const [totalPrice, setTotalPrice] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState(30)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await Fetch.get('/products')
        setProducts(res.data?.data || [])
      } catch (err) {
        console.error('Mahsulotlarni olishda xato:', err)
      }
    }
    fetchProducts()
  }, [])

  const filteredProducts = products.filter(product => {
    const queryLower = searchQuery.toLowerCase().trim()
    return (
      queryLower === '' ||
      product._id.toLowerCase().includes(queryLower) ||
      product.title.toLowerCase().includes(queryLower)
    )
  })

  const visibleProducts = filteredProducts.slice(0, visibleCount)
  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + 10, filteredProducts.length))
  }

  const handleAddProduct = product => {
    if (!selectedProducts.some(p => p._id === product._id)) {
      setSelectedProducts([
        ...selectedProducts,
        {
          ...product,
          quantity: 1,
          price: product.price || 0,
          unit: product.unit || 'дона' // avtomatik unit
        }
      ])
    }
  }

  const handleQuantityChange = (id, delta) => {
    setSelectedProducts(prev =>
      prev.map(p => {
        if (p._id === id) {
          const newQuantity = Math.max(1, Math.min(p.stock, p.quantity + delta))
          return { ...p, quantity: newQuantity }
        }
        return p
      })
    )
  }

  const handleInputQuantityChange = (id, value) => {
    setSelectedProducts(prev =>
      prev.map(p => {
        if (p._id === id) {
          const num = Number(value)
          const valid = Math.max(1, Math.min(p.stock, num || 1))
          return { ...p, quantity: valid }
        }
        return p
      })
    )
  }

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      const orderData = {
        customer,
        products: selectedProducts.map(p => ({
          product: p._id,
          amount: p.quantity,
          unit: p.unit,
          price: p.price
        })),
        status,
        payType,
        totalPrice: Number(totalPrice),
        orderDate: new Date()
      }

      await Fetch.post('/orders', orderData)
      alert('Буюртма муваффақиятли яратилди ✅')
      setSelectedProducts([])
      setCustomer('')
      setStatus('Янги')
      setPayType('--')
      setTotalPrice('')
      setSearchQuery('')
      setVisibleCount(30)
    } catch (err) {
      console.error(err)
      alert('Буюртма яратишда хатолик юз берди ❌')
    }
  }

  return (
    <div
      onClick={onClose}
      className='fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-999 p-4'
    >
      <div
        onClick={e => e.stopPropagation()}
        className='bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative'
      >
        <button
          onClick={onClose}
          className='absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700'
        >
          <X size={24} />
        </button>
        <div className='p-6'>
          <h2 className='text-2xl font-bold mb-6 text-gray-800'>
            Янги буюртма яратиш
          </h2>

          <form onSubmit={handleSubmit} className='space-y-8'>
            <div>
              <label className='block text-gray-700 font-medium mb-2'>
                Мижоз ID
              </label>
              <input
                type='text'
                disabled={true}
                value={customer}
                // onChange={e => setCustomer(e.target.value)}
                className='border border-gray-300 w-full p-3 rounded-lg text-gray-500'
                required
              />
            </div>

            <div>
              <label className='block text-gray-700 font-medium mb-2'>
                Маҳсулотларни қидириш
              </label>
              <div className='relative'>
                <input
                  type='text'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder='Қидириш...'
                  className='border border-gray-300 w-full p-3 rounded-lg pl-10 focus:ring-2 focus:ring-blue-500 outline-none'
                />
                <Search
                  className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
                  size={20}
                />
              </div>
            </div>

            <div>
              <label className='block text-gray-700 font-medium mb-2'>
                Мавжуд маҳсулотлар
              </label>
              <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-64 overflow-y-auto p-2 border border-gray-200 rounded-lg bg-gray-50'>
                {visibleProducts.map(product => (
                  <button
                    type='button'
                    key={product._id}
                    onClick={() => handleAddProduct(product)}
                    className='px-4 py-3 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition text-left'
                  >
                    <span className='font-medium text-gray-800'>
                      {product.title}
                    </span>
                    <p className='text-sm text-gray-500'>ID: {product.ID}</p>
                    <p className='text-sm text-gray-500'>
                      Қолдиқ: {product.stock} {product.unit || 'дона'}
                    </p>
                  </button>
                ))}
              </div>
              {visibleCount < filteredProducts.length && (
                <button
                  type='button'
                  onClick={handleLoadMore}
                  className='mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition'
                >
                  Яна 10 та юклаш
                </button>
              )}
            </div>

            {selectedProducts.length > 0 && (
              <div>
                <h3 className='font-semibold text-lg mb-3 text-gray-800'>
                  Танланган маҳсулотлар:
                </h3>
                <div className='space-y-4'>
                  {selectedProducts.map(item => (
                    <div
                      key={item._id}
                      className='flex items-center justify-between border-b py-3 border-gray-200 flex-wrap gap-4'
                    >
                      <div className='w-[300px] font-medium text-gray-800'>
                        {item.title}
                      </div>

                      <div className='w-[140px] flex items-center gap-3'>
                        <button
                          type='button'
                          onClick={() => handleQuantityChange(item._id, -1)}
                          className='p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition'
                        >
                          <Minus size={16} />
                        </button>
                        <input
                          type='number'
                          min='1'
                          max={item.stock}
                          value={item.quantity}
                          onChange={e =>
                            handleInputQuantityChange(item._id, e.target.value)
                          }
                          className='w-14 text-center border rounded-md'
                        />
                        <button
                          type='button'
                          onClick={() => handleQuantityChange(item._id, 1)}
                          className='p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition'
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      <span className='text-gray-700 font-medium w-[80px]'>
                        {item.unit || 'дона'}
                      </span>

                      <span className='w-[150px] text-gray-600 font-medium'>
                        {item.price.toLocaleString()} сўм
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6'>
              <div>
                <label className='block text-gray-700 font-medium mb-2'>
                  Ҳолат
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className='border border-gray-300 w-full p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none'
                >
                  <option>Янги</option>
                  <option>Қабул қилинди</option>
                  <option>Юборилди</option>
                  <option>Бажарилди</option>
                </select>
              </div>

              <div>
                <label className='block text-gray-700 font-medium mb-2'>
                  Тўлов тури
                </label>
                <select
                  value={payType}
                  onChange={e => setPayType(e.target.value)}
                  className='border border-gray-300 w-full p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none'
                >
                  <option>--</option>
                  <option>Naqd</option>
                  <option>Karta</option>
                  <option>Onlayn</option>
                </select>
              </div>

              <div>
                <label className='block text-gray-700 font-medium mb-2'>
                  Умумий нарх
                </label>
                <input
                  type='number'
                  value={totalPrice}
                  onChange={e => setTotalPrice(e.target.value)}
                  className='border border-gray-300 w-full p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none'
                  placeholder='Масалан: 1200000'
                  required
                />
              </div>
            </div>

            <button
              type='submit'
              className='flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition w-full sm:w-auto'
            >
              <Save size={18} />
              Буюртмани сақлаш
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
