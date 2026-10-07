import './Classes.css'
import './Shop.css'
import { useRef, useState } from 'react'
import { useProducts } from '../hooks/useProducts'
import MerchCheckout from './MerchCheckout'

export default function Shop() {
    const { products, loading } = useProducts()
    const [preselectedId, setPreselectedId] = useState(null)
    const checkoutRef = useRef(null)
    const activeProducts = products.filter(p => p.active)

    function inStock(product) {
        return (product.variants || []).some(v => v.stock > 0)
    }

    function choose(product) {
        setPreselectedId(product.id)
        checkoutRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    return (
        <div className='shop-page'>
            <div className='shop-header'>
                <h2>DaytOn1 Shop</h2>
                <p>Pickup only. Pay online and grab your order at class.</p>
            </div>

            {loading ? (
                <p className='shop-empty'>Loading...</p>
            ) : activeProducts.length === 0 ? (
                <p className='shop-empty'>Nothing is available right now. Check back soon!</p>
            ) : (
                <>
                    <div className='shop-grid'>
                        {activeProducts.map(product => (
                            <div key={product.id} className='shop-card'>
                                <div className='shop-card-img'>
                                    {product.imageUrl ? (
                                        <img src={product.imageUrl} alt={product.name} />
                                    ) : (
                                        <div className='shop-card-placeholder'>No photo yet</div>
                                    )}
                                </div>
                                <div className='shop-card-info'>
                                    <h3>{product.name}</h3>
                                    <p className='shop-card-price'>${product.price}</p>
                                    {product.description && <p className='shop-card-desc'>{product.description}</p>}
                                    <div className='shop-card-sizes'>
                                        {(product.variants || []).map(v => (
                                            <span key={v.size} className={v.stock > 0 ? '' : 'soldout'}>{v.size}</span>
                                        ))}
                                    </div>
                                    <button
                                        className='continue-btn'
                                        onClick={() => choose(product)}
                                        disabled={!inStock(product)}
                                    >
                                        {inStock(product) ? 'Choose Size' : 'Sold Out'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className='merch-section' ref={checkoutRef}>
                        <h2>Your Order</h2>
                        <MerchCheckout products={activeProducts} preselectedProductId={preselectedId} />
                    </div>
                </>
            )}
        </div>
    )
}