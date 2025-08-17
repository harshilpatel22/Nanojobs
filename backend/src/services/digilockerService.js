/**
 * DigiLocker API Integration Service
 * Handles Aadhar verification through DigiLocker
 */

const crypto = require('crypto');
const axios = require('axios');

class DigiLockerService {
  constructor() {
    this.clientId = process.env.DIGILOCKER_CLIENT_ID;
    this.clientSecret = process.env.DIGILOCKER_CLIENT_SECRET;
    this.redirectUri = process.env.DIGILOCKER_REDIRECT_URI || 'http://localhost:5001/api/auth/digilocker/callback';
    this.baseUrl = process.env.DIGILOCKER_BASE_URL || 'https://api.digitallocker.gov.in/public/oauth2/1';
    this.sandboxMode = process.env.NODE_ENV !== 'production';
  }

  /**
   * Generate DigiLocker OAuth URL for user consent
   */
  generateAuthUrl(state) {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      state: state,
      scope: 'openid profile aadhaar'
    });

    return `${this.baseUrl}/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code, state) {
    try {
      console.log('🔄 Exchanging DigiLocker code for token...');

      const response = await axios.post(`${this.baseUrl}/token`, {
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: this.redirectUri,
        client_id: this.clientId,
        client_secret: this.clientSecret
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      console.log('✅ DigiLocker token exchange successful');
      return response.data;
    } catch (error) {
      console.error('❌ DigiLocker token exchange failed:', error.response?.data || error.message);
      throw new Error('Failed to exchange DigiLocker authorization code');
    }
  }

  /**
   * Get user's Aadhar information from DigiLocker
   */
  async getAadharInfo(accessToken) {
    try {
      console.log('🔄 Fetching Aadhar info from DigiLocker...');

      const response = await axios.get(`${this.baseUrl}/userinfo`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const userInfo = response.data;
      
      // Extract Aadhar details
      const aadharInfo = {
        aadhaarNumber: userInfo.aadhaar_number,
        name: userInfo.name,
        dateOfBirth: userInfo.dob,
        gender: userInfo.gender,
        address: {
          street: userInfo.address?.street,
          city: userInfo.address?.city,
          state: userInfo.address?.state,
          pincode: userInfo.address?.pincode
        },
        verified: true,
        verifiedAt: new Date().toISOString()
      };

      console.log('✅ Aadhar info retrieved successfully');
      return aadharInfo;
    } catch (error) {
      console.error('❌ Failed to fetch Aadhar info:', error.response?.data || error.message);
      throw new Error('Failed to retrieve Aadhar information from DigiLocker');
    }
  }

  /**
   * Verify Aadhar document authenticity
   */
  async verifyAadharDocument(accessToken, documentId = 'ADHAR') {
    try {
      console.log('🔄 Verifying Aadhar document authenticity...');

      const response = await axios.get(`${this.baseUrl}/documents/${documentId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const document = response.data;
      
      const verificationResult = {
        documentId: document.doc_id,
        documentType: document.doc_type,
        isAuthentic: document.is_authentic,
        documentData: document.doc_data,
        verifiedAt: new Date().toISOString()
      };

      console.log('✅ Aadhar document verification completed');
      return verificationResult;
    } catch (error) {
      console.error('❌ Aadhar document verification failed:', error.response?.data || error.message);
      throw new Error('Failed to verify Aadhar document authenticity');
    }
  }

  /**
   * Generate state parameter for OAuth security
   */
  generateState(userId) {
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(16).toString('hex');
    return `${userId}_${timestamp}_${randomBytes}`;
  }

  /**
   * Verify state parameter
   */
  verifyState(state, expectedUserId) {
    try {
      const [userId, timestamp, random] = state.split('_');
      
      // Check if user ID matches
      if (userId !== expectedUserId) {
        return false;
      }
      
      // Check if state is not too old (10 minutes max)
      const stateAge = Date.now() - parseInt(timestamp);
      const maxAge = 10 * 60 * 1000; // 10 minutes
      
      return stateAge <= maxAge;
    } catch (error) {
      console.error('❌ State verification failed:', error);
      return false;
    }
  }

  /**
   * Sandbox mode helpers for testing
   */
  generateMockAadharData() {
    if (!this.sandboxMode) {
      throw new Error('Mock data only available in sandbox mode');
    }

    return {
      aadhaarNumber: '1234-5678-9012',
      name: 'Test User',
      dateOfBirth: '1990-01-01',
      gender: 'M',
      address: {
        street: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456'
      },
      verified: true,
      verifiedAt: new Date().toISOString(),
      mockData: true
    };
  }

  /**
   * Health check for DigiLocker service
   */
  async healthCheck() {
    try {
      if (this.sandboxMode) {
        return {
          status: 'healthy',
          mode: 'sandbox',
          configured: !!this.clientId && !!this.clientSecret
        };
      }

      // In production, ping DigiLocker API
      const response = await axios.get(`${this.baseUrl}/health`, {
        timeout: 5000
      });

      return {
        status: 'healthy',
        mode: 'production',
        apiStatus: response.status === 200 ? 'up' : 'down'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

module.exports = new DigiLockerService();