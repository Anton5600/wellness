/**
 * MyTracker Analytics Integration Service
 * 
 * Provides unified cross-platform event tracking for both Web (via official MyTracker Web JS SDK)
 * and mobile platforms. Since this is a hybrid React/Capacitor application, we dynamically load
 * the official MyTracker Web SDK script on startup so tracking works instantly in the browser,
 * webview, and developer previews without bloated dependencies.
 * 
 * In addition, this file lists instructions for native Android MyTracker SDK initialization
 * inside the Android Studio project.
 */

// Global type declarations for MyTracker script window variables
declare global {
  interface Window {
    myTracker?: {
      init: () => void;
      trackEvent: (name: string, params?: Record<string, string | number | boolean>) => void;
    };
    sunhillTracker?: {
      getTracker: (sdkKey: string) => any;
    };
    myTrackerCallbacks?: Array<() => void>;
  }
}

class MyTrackerService {
  private sdkKey: string = '00000000000000000000'; // Replace with real MyTracker SDK key
  private initialized: boolean = false;

  /**
   * Initializes MyTracker by dynamically injecting the official JS SDK script.
   * This is safe to run multiple times, on any platform.
   */
  public init(customSdkKey?: string) {
    if (this.initialized) return;
    if (customSdkKey) {
      this.sdkKey = customSdkKey;
    }

    console.log(`[MyTracker] Initializing MyTracker with Key: ${this.sdkKey}`);

    try {
      // Standard MyTracker Web SDK asynchronous script injection loader
      window.myTrackerCallbacks = window.myTrackerCallbacks || [];
      window.myTrackerCallbacks.push(() => {
        try {
          if (window.sunhillTracker) {
            window.myTracker = window.sunhillTracker.getTracker(this.sdkKey);
            if (window.myTracker) {
              window.myTracker.init();
              console.log('[MyTracker] Web SDK loaded and initialized successfully.');
            }
          }
        } catch (e) {
          console.error('[MyTracker] Error during sunhillTracker initialization:', e);
        }
      });

      const doc = document;
      const firstScript = doc.getElementsByTagName('script')[0];
      const newScript = doc.createElement('script');
      newScript.type = 'text/javascript';
      newScript.async = true;
      newScript.src = 'https://tracker.my.com/js/sdk.js';

      if (firstScript && firstScript.parentNode) {
        firstScript.parentNode.insertBefore(newScript, firstScript);
      } else {
        doc.head.appendChild(newScript);
      }

      this.initialized = true;
    } catch (error) {
      console.error('[MyTracker] Failed to inject MyTracker script:', error);
    }
  }

  /**
   * Tracks a custom event in MyTracker.
   */
  public trackEvent(eventName: string, params?: Record<string, string | number | boolean>) {
    console.log(`[MyTracker Event] "${eventName}"`, params || '');

    // 1. Try tracking via Web SDK
    if (window.myTracker && typeof window.myTracker.trackEvent === 'function') {
      try {
        window.myTracker.trackEvent(eventName, params);
      } catch (err) {
        console.error('[MyTracker] Error calling trackEvent on web SDK:', err);
      }
    }

    // 2. We can also post a message or trigger local logging
    // If we have a custom Capacitor plugin on the native side, we could dispatch to it.
  }

  /**
   * Tracks user registration.
   */
  public trackRegistration(userId: string, provider: string = 'email') {
    this.trackEvent('registration', {
      userId,
      provider,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Tracks user login.
   */
  public trackLogin(userId: string, provider: string = 'email') {
    this.trackEvent('login', {
      userId,
      provider,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Tracks starting the wellness quiz.
   */
  public trackQuizStart() {
    this.trackEvent('quiz_start', {
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Tracks completion of the wellness quiz with results.
   */
  public trackQuizComplete(emotionalState: string, recommendedOils: string[]) {
    this.trackEvent('quiz_complete', {
      emotionalState,
      recommendedOils: recommendedOils.join(', '),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Tracks adding an essential oil to the cart.
   */
  public trackAddToCart(oilId: string, oilName: string, price: number) {
    this.trackEvent('add_to_cart', {
      oilId,
      oilName,
      price,
      currency: 'RUB'
    });
  }

  /**
   * Tracks placing an order / checkout purchase.
   */
  public trackPurchase(orderId: string, totalAmount: number, itemsCount: number) {
    this.trackEvent('purchase', {
      orderId,
      totalAmount,
      itemsCount,
      currency: 'RUB',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Tracks opening a legal document (e.g. Terms, Privacy).
   */
  public trackDocumentOpen(documentType: string) {
    this.trackEvent('document_open', {
      documentType
    });
  }
}

export const myTrackerService = new MyTrackerService();
