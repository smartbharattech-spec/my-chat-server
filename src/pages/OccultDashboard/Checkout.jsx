import React, { useState, useEffect } from 'react';
import {
    ShoppingCart, MapPin, CreditCard, CheckCircle2, ArrowLeft, Sparkles, Package
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../services/ToastService';
import { motion, AnimatePresence } from 'framer-motion';
import './Checkout.css';

const emptyAddress = {
    full_name: '', phone: '', email: '',
    address_line1: '', address_line2: '',
    city: '', state: '', pincode: '', country: 'India'
};

const STEPS = ['Cart Review', 'Shipping', 'Billing', 'Confirm'];

const AddressForm = ({ values, onChange, title, icon: Icon }) => (
    <div className="checkout-panel">
        <div className="panel-header">
            <div className="panel-icon-wrapper">
                <Icon size={24} />
            </div>
            <h2>{title}</h2>
        </div>
        <div className="address-form-grid">
            <div className="form-group">
                <label>Full Name *</label>
                <input type="text" className="form-input" value={values.full_name} onChange={onChange('full_name')} placeholder="John Doe" />
            </div>
            <div className="form-group">
                <label>Phone *</label>
                <input type="tel" className="form-input" value={values.phone} onChange={onChange('phone')} placeholder="+91 9876543210" />
            </div>
            <div className="form-group full-width">
                <label>Email Address</label>
                <input type="email" className="form-input" value={values.email} onChange={onChange('email')} placeholder="john@example.com" />
            </div>
            <div className="form-group full-width">
                <label>Address Line 1 *</label>
                <input type="text" className="form-input" value={values.address_line1} onChange={onChange('address_line1')} placeholder="Flat / House No. / Building" />
            </div>
            <div className="form-group full-width">
                <label>Address Line 2</label>
                <input type="text" className="form-input" value={values.address_line2} onChange={onChange('address_line2')} placeholder="Area / Street / Sector" />
            </div>
            <div className="form-group">
                <label>City *</label>
                <input type="text" className="form-input" value={values.city} onChange={onChange('city')} placeholder="New Delhi" />
            </div>
            <div className="form-group">
                <label>State *</label>
                <input type="text" className="form-input" value={values.state} onChange={onChange('state')} placeholder="Delhi" />
            </div>
            <div className="form-group">
                <label>Pincode *</label>
                <input type="text" className="form-input" value={values.pincode} onChange={onChange('pincode')} placeholder="110001" />
            </div>
            <div className="form-group">
                <label>Country</label>
                <input type="text" className="form-input" value={values.country} onChange={onChange('country')} placeholder="India" />
            </div>
        </div>
    </div>
);

export default function Checkout() {
    const navigate = useNavigate();
    const { cartItems, cartSubtotal, cartGst, cartTotal, clearCart } = useCart();
    const { showToast } = useToast();

    const location = useLocation();
    const [activeStep, setActiveStep] = useState(0);
    const [shipping, setShipping] = useState(emptyAddress);
    const [billing, setBilling] = useState(emptyAddress);
    const [sameAsShipping, setSameAsShipping] = useState(true);
    const [placing, setPlacing] = useState(false);
    const [user, setUser] = useState(null);
    const [orderSuccess, setOrderSuccess] = useState(false);

    // Express order from "Order Now"
    const expressOrder = location.state?.product ? {
        product: location.state.product,
        expert: { id: location.state.product.seller_id || location.state.product.expert_id, name: location.state.product.expert_name },
        quantity: location.state.quantity || 1,
        selectedOptions: location.state.selectedOptions || {},
        cartItemId: 'express-' + Date.now()
    } : null;

    const isCourse = location.search.includes('type=course') || (expressOrder?.product?.type === 'course');
    const displayItems = expressOrder ? [expressOrder] : cartItems;
    const displaySubtotal = expressOrder 
        ? parseFloat(expressOrder.product.price) * expressOrder.quantity 
        : cartSubtotal;
    const displayGst = expressOrder ? displaySubtotal * 0.18 : cartGst;
    const displayTotal = expressOrder ? displaySubtotal + displayGst : cartTotal;

    useEffect(() => {
        if (isCourse && activeStep === 1) {
            setActiveStep(3); // Skip shipping and address for courses
        }
    }, [isCourse, activeStep]);

    useEffect(() => {
        const stored = localStorage.getItem('occult_user');
        if (!stored) {
            navigate('/occult/login');
            return;
        }
        const u = JSON.parse(stored);
        setUser(u);
        setShipping(prev => ({ ...prev, full_name: u.name || '', email: u.email || '' }));
        setBilling(prev => ({ ...prev, full_name: u.name || '', email: u.email || '' }));
    }, [navigate]);

    useEffect(() => {
        if (!expressOrder && cartItems.length === 0 && !orderSuccess) {
            navigate('/occult/shop');
        }
    }, [cartItems, orderSuccess, navigate, expressOrder]);

    const handleShippingChange = (field) => (e) => {
        setShipping(prev => ({ ...prev, [field]: e.target.value }));
        if (sameAsShipping) {
            setBilling(prev => ({ ...prev, [field]: e.target.value }));
        }
    };

    const handleBillingChange = (field) => (e) => {
        setBilling(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleNext = () => setActiveStep(s => s + 1);
    const handleBack = () => setActiveStep(s => s - 1);

    const validateAddress = (addr) => {
        return addr.full_name && addr.phone && addr.address_line1 && addr.city && addr.state && addr.pincode;
    };

    const handlePlaceOrder = async () => {
        const effectiveBilling = sameAsShipping ? shipping : billing;
        setPlacing(true);

        if (isCourse) {
            try {
                const res = await fetch('/api/purchase_course.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: user.id,
                        course_id: expressOrder?.product?.id || displayItems[0].product.id,
                        payment_method: 'PhonePe',
                        amount: displayTotal
                    })
                });
                const data = await res.json();
                if (data.status === 'success') {
                    setOrderSuccess(true);
                    showToast('Purchase submitted! Redirecting to payment...', 'success');
                    setTimeout(() => {
                        navigate(`/phonepe-payment?amount=${displayTotal}&order_id=COURSE_${Date.now()}&type=course`);
                    }, 1000);
                }
            } catch (err) {
                showToast('Error processing course purchase', 'error');
                setPlacing(false);
            }
            return;
        }

        const items = displayItems.map(({ product, expert, quantity, selectedOptions }) => ({
            product_id: product.id,
            expert_id: expert?.id || expert?.user_id,
            quantity,
            price: parseFloat(product.price),
            product_type: product.product_type || 'product',
            selected_options: selectedOptions || {}
        }));

        try {
            const res = await fetch('/api/marketplace/create_order.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    items,
                    shipping,
                    billing: effectiveBilling
                })
            });
            const data = await res.json();
            if (data.status === 'success') {
                const orderId = `OCCULT_${data.order_id}_${Date.now()}`;
                setOrderSuccess(true);
                if (!expressOrder) clearCart();
                showToast('Order placed! Redirecting to payment...', 'success');
                setTimeout(() => {
                    navigate(`/phonepe-payment?amount=${data.total}&order_id=${orderId}&type=product`);
                }, 1000);
            } else {
                showToast(data.message || 'Failed to place order', 'error');
                setPlacing(false);
            }
        } catch (err) {
            showToast('Network error. Please try again.', 'error');
            setPlacing(false);
        }
    };


    return (
        <div className="checkout-wrapper">
            <div className="checkout-container">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="checkout-header">
                    <button className="btn-back" onClick={() => navigate(-1)}>
                        <ArrowLeft size={18} /> Back
                    </button>
                    <div className="header-title-box">
                        <div className="header-icon">
                            <ShoppingCart size={24} />
                        </div>
                        <div className="header-text">
                            <h1>Checkout</h1>
                            <p>Complete your sacred order</p>
                        </div>
                    </div>
                </motion.div>

                {/* Stepper */}
                <div className="checkout-stepper">
                    <div className="stepper-line"></div>
                    <div className="stepper-line-active" style={{ width: `${(activeStep / (STEPS.length - 1)) * 100}%` }}></div>
                    {STEPS.map((label, index) => (
                        <div key={label} className={`step-item ${activeStep === index ? 'active' : ''} ${activeStep > index ? 'completed' : ''}`}>
                            <div className="step-circle">
                                {activeStep > index ? <CheckCircle2 size={18} /> : index + 1}
                            </div>
                            <span className="step-label">{label}</span>
                        </div>
                    ))}
                </div>

                <div className="checkout-grid">
                    {/* Main Forms */}
                    <div className="checkout-main">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeStep}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                {/* Step 0: Cart Review */}
                                {activeStep === 0 && (
                                    <div className="checkout-panel">
                                        <div className="panel-header">
                                            <div className="panel-icon-wrapper">
                                                <Package size={24} />
                                            </div>
                                            <h2>Review Your Cart</h2>
                                        </div>
                                        {displayItems.map(({ product, expert, quantity, selectedOptions, cartItemId }) => (
                                            <div key={cartItemId} className="review-item">
                                                <div className="review-item-img">
                                                    <img
                                                        src={product.image_url ? `/${product.image_url}` : 'https://placehold.co/80x80?text=Item'}
                                                        alt={product.name}
                                                        onError={e => { e.target.src = 'https://placehold.co/80x80?text=Item'; }}
                                                    />
                                                </div>
                                                <div className="review-item-info">
                                                    <h3>{product.name}</h3>
                                                    <p>by {expert?.name}</p>
                                                    {selectedOptions && Object.keys(selectedOptions).length > 0 && (
                                                        <p style={{ color: '#0ea5e9', fontSize: '0.8rem', marginTop: '4px' }}>
                                                            {Object.entries(selectedOptions).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                                                        </p>
                                                    )}
                                                    <p style={{ marginTop: '8px', color: '#0f172a', fontWeight: '700' }}>Qty: {quantity}</p>
                                                </div>
                                                <div className="review-item-price">
                                                    ₹{(parseFloat(product.price) * quantity).toFixed(2)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Step 1: Shipping */}
                                {activeStep === 1 && (
                                    <AddressForm
                                        values={shipping}
                                        onChange={handleShippingChange}
                                        title="Shipping Address"
                                        icon={MapPin}
                                    />
                                )}

                                {/* Step 2: Billing */}
                                {activeStep === 2 && (
                                    <div className="checkout-panel">
                                        <label className="checkbox-wrap">
                                            <input
                                                type="checkbox"
                                                checked={sameAsShipping}
                                                onChange={e => {
                                                    setSameAsShipping(e.target.checked);
                                                    if (e.target.checked) setBilling(shipping);
                                                }}
                                            />
                                            <span>Billing address is same as shipping address</span>
                                        </label>
                                        {!sameAsShipping && (
                                            <div style={{ marginTop: '20px' }}>
                                                <AddressForm
                                                    values={billing}
                                                    onChange={handleBillingChange}
                                                    title="Billing Address"
                                                    icon={CreditCard}
                                                />
                                            </div>
                                        )}
                                        {sameAsShipping && (
                                            <div className="checkout-alert">
                                                <CheckCircle2 size={24} />
                                                We will use your shipping address for billing.
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Step 3: Orders Summary / Confirm */}
                                {activeStep === 3 && (
                                    <div className="checkout-panel">
                                        <div className="panel-header">
                                            <div className="panel-icon-wrapper">
                                                <CreditCard size={24} />
                                            </div>
                                            <h2>Confirm & Pay</h2>
                                        </div>

                                        <div className="address-summary-card">
                                            <h4>📦 SHIPPING TO</h4>
                                            <p className="name">{shipping.full_name}</p>
                                            <p>{shipping.address_line1}{shipping.address_line2 ? `, ${shipping.address_line2}` : ''}</p>
                                            <p>{shipping.city}, {shipping.state} - {shipping.pincode}</p>
                                            <p style={{ marginTop: '8px' }}>📞 {shipping.phone}</p>
                                        </div>

                                        <div className="checkout-alert">
                                            <Sparkles size={24} />
                                            You will be redirected to our secure PhonePe gateway after placing the order.
                                        </div>
                                    </div>
                                )}

                                {/* Navigation Buttons */}
                                <div className="checkout-actions">
                                    <button
                                        className="btn-outline"
                                        onClick={handleBack}
                                        disabled={activeStep === 0 || placing}
                                    >
                                        Back
                                    </button>
                                    {activeStep < STEPS.length - 1 ? (
                                        <button
                                            className="btn-solid"
                                            onClick={handleNext}
                                            disabled={
                                                (activeStep === 1 && !validateAddress(shipping)) ||
                                                (activeStep === 2 && !sameAsShipping && !validateAddress(billing))
                                            }
                                        >
                                            Continue
                                        </button>
                                    ) : (
                                        <button
                                            className="btn-solid btn-place-order"
                                            onClick={handlePlaceOrder}
                                            disabled={placing || orderSuccess}
                                        >
                                            {placing ? 'Placing Order...' : 'Place Order & Pay'}
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="checkout-sidebar">
                        <div className="summary-box">
                            <h3 className="summary-title">Order Summary</h3>
                            <div className="summary-items-list">
                                {displayItems.map(({ product, quantity, selectedOptions, cartItemId }) => (
                                    <div key={cartItemId} className="summary-item">
                                        <div className="summary-item-left">
                                            <div className="summary-thumb">
                                                <img
                                                    src={product.image_url ? `/${product.image_url}` : 'https://placehold.co/48x48?text=Item'}
                                                    alt={product.name}
                                                    onError={e => { e.target.src = 'https://placehold.co/48x48?text=Item'; }}
                                                />
                                            </div>
                                            <div className="summary-item-info">
                                                <span className="summary-item-name">{product.name}</span>
                                                {selectedOptions && Object.keys(selectedOptions).length > 0 && (
                                                    <span style={{ color: '#0ea5e9', fontSize: '0.7rem' }}>
                                                        {Object.values(selectedOptions).join(', ')}
                                                    </span>
                                                )}
                                                <span className="summary-item-qty">Qty: {quantity}</span>
                                            </div>
                                        </div>
                                        <div className="summary-item-price">
                                            ₹{(parseFloat(product.price) * quantity).toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="summary-divider"></div>
                            <div className="summary-row">
                                <span>Subtotal</span>
                                <span>₹{displaySubtotal.toFixed(2)}</span>
                            </div>
                            <div className="summary-row">
                                <span>GST (18%)</span>
                                <span>₹{displayGst.toFixed(2)}</span>
                            </div>
                            <div className="summary-row">
                                <span>Shipping</span>
                                <span style={{ color: '#10b981' }}>Free</span>
                            </div>
                            <div className="summary-divider"></div>
                            <div className="summary-total">
                                <span>Total (Incl. GST)</span>
                                <span>₹{displayTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
