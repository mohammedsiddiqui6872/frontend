import { useState, FormEvent } from 'react';
import { Users, User, Phone, Mail, Loader } from 'lucide-react';

interface CustomerDetailFormProps {
  t: any;
  onSubmit: (details: CustomerDetails) => void;
  isSubmitting?: boolean;
}

export interface CustomerDetails {
  name: string;
  phone?: string;
  email?: string;
  occupancy?: number;
}

export const CustomerDetailForm = ({ 
  t, 
  onSubmit,
  isSubmitting = false 
}: CustomerDetailFormProps) => {
  const [formData, setFormData] = useState<CustomerDetails>({
    name: '',
    phone: '',
    email: '',
    occupancy: 1
  });
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    // Name is mandatory
    if (!formData.name.trim()) {
      newErrors['name'] = 'Customer name is required';
    }
    
    // Validate phone if provided
    if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors['phone'] = 'Please enter a valid phone number';
    }
    
    // Validate email if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors['email'] = 'Please enter a valid email address';
    }
    
    // Validate occupancy
    if (formData.occupancy && (formData.occupancy < 1 || formData.occupancy > 20)) {
      newErrors['occupancy'] = 'Occupancy must be between 1 and 20';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl animate-modalSlideUp">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={40} className="text-purple-600" />
          </div>
          <h2 className="text-3xl font-bold mb-2 text-gray-800">Welcome Guests!</h2>
          <p className="text-gray-600">Please provide your details to enhance your dining experience</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Customer Name - Mandatory */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User size={16} className="inline mr-2" />
              Customer Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500 transition-colors
                ${errors['name'] ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter your name"
              disabled={isSubmitting}
            />
            {errors['name'] && (
              <p className="text-red-500 text-sm mt-1">{errors['name']}</p>
            )}
          </div>
          
          {/* Phone Number - Optional */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone size={16} className="inline mr-2" />
              Phone Number <span className="text-gray-400">(Optional)</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500 transition-colors
                ${errors['phone'] ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="+971 50 123 4567"
              disabled={isSubmitting}
            />
            {errors['phone'] && (
              <p className="text-red-500 text-sm mt-1">{errors['phone']}</p>
            )}
          </div>
          
          {/* Email - Optional */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail size={16} className="inline mr-2" />
              Email Address <span className="text-gray-400">(Optional)</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500 transition-colors
                ${errors['email'] ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="your.email@example.com"
              disabled={isSubmitting}
            />
            {errors['email'] && (
              <p className="text-red-500 text-sm mt-1">{errors['email']}</p>
            )}
          </div>
          
          {/* Number of Guests */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users size={16} className="inline mr-2" />
              Number of Guests <span className="text-gray-400">(Optional)</span>
            </label>
            <select
              value={formData.occupancy}
              onChange={(e) => setFormData({ ...formData, occupancy: parseInt(e.target.value) })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
              disabled={isSubmitting}
            >
              {[...Array(20)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1} {i === 0 ? 'Guest' : 'Guests'}
                </option>
              ))}
            </select>
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full 
                     hover:shadow-lg transition-all duration-300 font-semibold text-lg
                     disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <Loader size={20} className="animate-spin mr-2" />
                Processing...
              </>
            ) : (
              'Continue to Menu'
            )}
          </button>
          
          <p className="text-center text-xs text-gray-500 mt-4">
            Your information helps us provide better service and will be kept confidential
          </p>
        </form>
      </div>
    </div>
  );
};