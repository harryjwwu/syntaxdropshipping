import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Package, MapPin, Layers, Clock, 
         Shield, Zap } from 'lucide-react';
import { productAPI } from '../utils/api';
import { CardSkeleton } from '../components/LoadingSpinner';
import { useTranslation } from '../hooks/useTranslation';
import WhatsAppButton from '../components/WhatsAppButton';

const HomePage = () => {
  const { t } = useTranslation();
  const [hotProducts, setHotProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHotProducts();
  }, []);

  const loadHotProducts = async () => {
    try {
      const response = await productAPI.getHotProducts();
      setHotProducts(response.products);
    } catch (error) {
      console.error('Failed to load hot products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Hero Section Component
  const HeroSection = () => (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-500">
        <div className="absolute inset-0 bg-black opacity-20"></div>
      </div>

      {/* Animated background shapes */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white bg-opacity-10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white bg-opacity-5 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="relative z-10 container-custom text-center text-white px-4">
        <div className="max-w-4xl mx-auto">
          {/* Logo/Brand */}
          <div className="flex items-center justify-center mb-8">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Package className="w-8 h-8 text-white" />
            </div>
            <div className="ml-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
                Syntax <span className="text-yellow-300">Dropshipping</span>
              </h1>
            </div>
          </div>

          {/* Main heading */}
          <div className="mb-6">
            <p className="text-lg sm:text-xl lg:text-2xl font-medium mb-4">
              {t('home.subtitle')}
            </p>
          </div>

          {/* Value proposition */}
          <p className="text-lg sm:text-xl lg:text-2xl mb-8 leading-relaxed max-w-3xl mx-auto">
            {t('home.description')}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              to="/services"
              className="btn-primary text-lg px-8 py-4 bg-orange-500 hover:bg-orange-600 transform hover:scale-105 transition-all duration-300"
            >
              {t('home.getStarted')}
            </Link>
            <WhatsAppButton 
              variant="inline"
              messageKey="whatsapp.heroMessage"
              className="text-lg px-8 py-4"
            />
          </div>

          {/* Trust indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {[
              { icon: Package, label: 'Dropshipping' },
              { icon: MapPin, label: 'Global Shipping' },
              { icon: Shield, label: 'Quality Control' },
              { icon: Zap, label: 'Fast Processing' }
            ].map((item, index) => (
              <div key={index} className="flex flex-col items-center p-4 bg-white bg-opacity-10 rounded-lg backdrop-blur-sm">
                <item.icon className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );

  // What We Do Section
  const WhatWeDoSection = () => (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            What we can do for you?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            List and sell products without ever having to buy inventory up front or pack and ship orders.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              number: "01",
              icon: Package,
              title: "Dropshipping",
              description: "We handle full order on your behalf while you concentrate on the marketing aspect. You sell your items in any eCommerce platform, We find your items, We fulfill your items, and we keep you updated!"
            },
            {
              number: "02", 
              icon: MapPin,
              title: "China Sourcing",
              description: "Syntax Dropshipping manages your production from inquiry to delivering to your doorstep. We provide a full range of services from sourcing existing products to manufacturing for your company."
            },
            {
              number: "03",
              icon: Layers,
              title: "Packing Customization", 
              description: "Your products will be packaged according to your packaging. Syntax dropshipping repackages your products by adding the boxes or bags you specify, bringing a special touch to your products."
            },
            {
              number: "04",
              icon: Clock,
              title: "Order Fulfillment",
              description: "12 to 24 hours fulfillment for stocked items. We understand the struggle when dealing with damaged and lost parcels and provide quick solutions and a customer-friendly refund policy."
            }
          ].map((service, index) => (
            <div key={index} className="relative group">
              {/* Service card */}
              <div className="bg-white rounded-2xl p-8 shadow-soft hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                {/* Number badge */}
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {service.number}
                </div>

                {/* Icon */}
                <div className="mb-6 pt-4">
                  <div className="w-16 h-16 bg-primary-50 rounded-xl flex items-center justify-center">
                    <service.icon className="w-8 h-8 text-primary-600" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-4">{service.title}</h3>
                <p className="text-gray-600 leading-relaxed">{service.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  // Platform Integration Section
  const PlatformSection = () => (
    <section className="section-padding bg-gray-50">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Automatic Order Fulfillment
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We offer seamless integration with:
          </p>
        </div>

        {/* Platform logos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {[
            { name: 'Shopify', logo: '🛍️', color: 'bg-green-50 text-green-600' },
            { name: 'WooCommerce', logo: '🛒', color: 'bg-purple-50 text-purple-600' },
            { name: 'Amazon', logo: '📦', color: 'bg-orange-50 text-orange-600' },
            { name: 'eBay', logo: '🏪', color: 'bg-blue-50 text-blue-600' }
          ].map((platform, index) => (
            <div key={index} className="bg-white rounded-2xl p-8 shadow-soft hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className={`w-16 h-16 ${platform.color} rounded-xl flex items-center justify-center text-3xl mb-4 mx-auto`}>
                {platform.logo}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center">{platform.name}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  // Hot Products Section
  const HotProductsSection = () => (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Hot Products
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover our most popular dropshipping products
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <CardSkeleton key={index} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {hotProducts.map((product, index) => (
              <div key={index} className="bg-white rounded-xl shadow-soft hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
                <div className="aspect-w-16 aspect-h-12 bg-gray-200 rounded-t-xl">
                  <div className="w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <Package className="w-12 h-12 text-gray-400" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.title}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-primary-600">{product.price}</span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {product.category}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Link
            to="/products"
            className="btn-primary inline-flex items-center gap-2"
          >
            View All Products
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </section>
  );

  // Stats Section
  const StatsSection = () => (
    <section className="section-padding bg-gradient-to-r from-primary-500 to-secondary-500">
      <div className="container-custom">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
          {[
            { value: "10K+", label: "Orders Fulfilled" },
            { value: "500+", label: "Happy Clients" },
            { value: "50+", label: "Countries Served" },
            { value: "24/7", label: "Support Available" }
          ].map((stat, index) => (
            <div key={index} className="group">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300">
                {stat.value}
              </div>
              <div className="text-sm sm:text-base text-white/90">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  // CTA Section
  const CTASection = () => (
    <section className="section-padding bg-gray-900">
      <div className="container-custom text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Start Your Dropshipping Journey?
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Join thousands of entrepreneurs who trust Syntax Dropshipping for their e-commerce success.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="btn-primary text-lg px-8 py-4">
              Get Started Free
            </Link>
            <Link to="/contact" className="btn-secondary text-lg px-8 py-4">
              Contact Sales
            </Link>
          </div>
        </div>
      </div>
    </section>
  );

  return (
    <div className="min-h-screen">
      <HeroSection />
      <WhatWeDoSection />
      <PlatformSection />
      <HotProductsSection />
      <StatsSection />
      <CTASection />
      
      {/* Floating WhatsApp Button */}
      <WhatsAppButton 
        variant="floating"
        messageKey="whatsapp.heroMessage"
      />
    </div>
  );
};

export default HomePage;