import React from 'react';
import { Package, MapPin, Layers, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const ServicesPage = () => {
  const services = [
    {
      id: 'dropshipping',
      icon: Package,
      title: 'Dropshipping',
      description: 'We handle full order on your behalf while you concentrate on the marketing aspect.',
      features: [
        'No inventory management required',
        'Automated order processing',
        'Real-time order tracking',
        'Quality control checks',
        'Customer service support'
      ],
      benefits: [
        'Zero upfront investment',
        'Reduced operational costs',
        'Focus on marketing and sales',
        'Scalable business model'
      ]
    },
    {
      id: 'sourcing',
      icon: MapPin,
      title: 'China Sourcing',
      description: 'Complete management from inquiry to delivery to your doorstep.',
      features: [
        'Product research and validation',
        'Supplier verification',
        'Price negotiation',
        'Quality inspection',
        'Logistics coordination'
      ],
      benefits: [
        'Access to manufacturers',
        'Competitive pricing',
        'Quality assurance',
        'Reduced sourcing risks'
      ]
    },
    {
      id: 'packaging',
      icon: Layers,
      title: 'Custom Packaging',
      description: 'Personalized packaging to enhance your brand value.',
      features: [
        'Custom box design',
        'Branded packaging materials',
        'Insert cards and labels',
        'Gift wrapping options',
        'Eco-friendly materials'
      ],
      benefits: [
        'Enhanced brand recognition',
        'Professional presentation',
        'Increased customer satisfaction',
        'Marketing opportunities'
      ]
    },
    {
      id: 'fulfillment',
      icon: Clock,
      title: 'Order Fulfillment',
      description: '12-24 hours processing for stocked items with global shipping.',
      features: [
        'Fast order processing',
        'Multiple shipping options',
        'Global delivery network',
        'Package tracking',
        'Return management'
      ],
      benefits: [
        'Quick turnaround time',
        'Reliable delivery',
        'Customer satisfaction',
        'Reduced handling costs'
      ]
    }
  ];

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-20">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Our Services</h1>
          <p className="text-xl max-w-3xl mx-auto leading-relaxed">
            Comprehensive dropshipping solutions designed to help you build and scale 
            your e-commerce business with confidence.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          {services.map((service, index) => (
            <div key={service.id} className={`mb-20 ${index !== services.length - 1 ? 'border-b border-gray-200 pb-20' : ''}`}>
              <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                {/* Content */}
                <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                  <div className="flex items-center mb-6">
                    <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center mr-4">
                      <service.icon className="w-8 h-8 text-primary-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">{service.title}</h2>
                  </div>
                  
                  <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                    {service.description}
                  </p>

                  {/* Features */}
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Key Features</h3>
                    <ul className="space-y-3">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Benefits Card */}
                <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                  <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl p-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Benefits</h3>
                    <ul className="space-y-4">
                      {service.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-center">
                          <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
                          <span className="text-gray-700 font-medium">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                    
                    {/* CTA */}
                    <div className="mt-8">
                      <Link
                        to="/contact"
                        className="inline-flex items-center text-primary-600 font-semibold hover:text-primary-700 transition-colors"
                      >
                        Get Started with {service.title}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Integration Section */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Seamless Platform Integration
          </h2>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
            Connect your store with our services through popular e-commerce platforms
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            {[
              { name: 'Shopify', emoji: '🛍️' },
              { name: 'WooCommerce', emoji: '🛒' },
              { name: 'Amazon', emoji: '📦' },
              { name: 'eBay', emoji: '🏪' }
            ].map((platform, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-soft hover:shadow-xl transition-all duration-300">
                <div className="text-4xl mb-3">{platform.emoji}</div>
                <h3 className="font-semibold text-gray-900">{platform.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of successful entrepreneurs who trust our services
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="btn-primary bg-white text-primary-600 hover:bg-gray-100">
              Start Free Trial
            </Link>
            <Link to="/contact" className="btn-secondary">
              Contact Sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ServicesPage;