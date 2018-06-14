

/**
*@description Register the service worker
*/
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').then(registration => {
      // Registration was successful
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }, error => {
      // registration failed :(
      console.log('ServiceWorker registration failed: ', error);
    });
  });
}


/**
 * @description Common database helper functions.
 */
class DBHelper {

  /**
   * @description Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }
  
  /**
  * @description Open IDB and create an idb store
  */
static openIDB() {
    return idb.open('restaurantReviewsApp', 1, upgradeDb => {
      if (!upgradeDb.objectStoreNames.contains('restaurants')) {
        const store = upgradeDb.createObjectStore('restaurants', {
          keyPath: 'id'
        });
      }
    });
  }
  

  /**
  * @description Getting all the informations from IDB
  */
  
  static loadFromIDB(transactionName, storeName) {
    return DBHelper.openIDB().then(db => {
      const index = db.transaction(transactionName).objectStore(storeName);
      return index.getAll();
    });
  }
  
  /**
  * @description Putting informations restaurants to IDB
  */
  
  static saveToIDB(data, transactionName, storeName) {
    return DBHelper.openIDB().then(db => {
      if (!db) return;

      const tx = db.transaction(transactionName, 'readwrite');
      const store = tx.objectStore(storeName);

      data.map(bit => store.put(bit));

      return tx.complete;
    });
  }
  
/**
* @description Getting all the informations from API
*/

static loadFromAPI() {
    return fetch(DBHelper.DATABASE_URL)
      .then(response => response.json())
      .then(data => {
        // Write items to IDB for next visit
        DBHelper.saveToIDB(data, 'restaurants', 'restaurants');
        console.log(data);
        return data;
      });
  }
  
  /**
   * @description Fetch all restaurants.
   * @param callback
   */
  static fetchRestaurants(callback) {
    DBHelper.loadFromIDB('restaurants', 'restaurants')
      .then(data => {
        if (data.length == 0) {
          // Make an API request
          return DBHelper.loadFromAPI();
        }
        console.log(`FROM IDB: ${data}`);
        return data;
      })
      .then(restaurants => {
        callback(null, restaurants);
      })
      .catch(error => {
        console.log(`Something is wrong: ${error}`);
        callback(error, null);
      });
  }

  /**
   * @description Fetch a restaurant by its ID.
   * @param {string} id - ID of the restaurant
   * @param {string} callback
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        console.log(`Something is wrong: ${error}`);
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) {
          // Got the restaurant
          callback(null, restaurant);
        } else {
          // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * @description Fetch restaurants by a cuisine type with proper error handling.
   * @param {string} cuisine - Cuisine of the restaurants
   * @param {string} callback
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * @description Fetch restaurants by a neighborhood with proper error handling.
   * @param {string} neighborhood - Neighborhood of the restaurant
   * @param {string} callback
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * @description Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   * @param {string} cuisine - Cuisine of the restaurants
   * @param {string} neighborhood - Neighborhood of the restaurants
   * @param {string} callback
   */
  static fetchRestaurantByCuisineAndNeighborhood(
    cuisine,
    neighborhood,
    callback
  ) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != 'all') {
          // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') {
          // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * @description Fetch all neighborhoods with proper error handling.
   * @param {string} callback
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map(
          (v, i) => restaurants[i].neighborhood
        );
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter(
          (v, i) => neighborhoods.indexOf(v) == i
        );
        console.log(uniqueNeighborhoods);
        // return uniqueNeighborhoods;
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * @description Fetch all cuisines with proper error handling.
   * @param {string} callback
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter(
          (v, i) => cuisines.indexOf(v) == i
        );
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * @description Restaurant page URL.
   * @param {string} restaurant
   */
  static urlForRestaurant(restaurant) {
    return `./restaurant.html?id=${restaurant.id}`;
  }

  /**
   * @description Restaurant image URL.
   * @param {string} restaurant
   */
  static imageUrlForRestaurant(restaurant) {
    let { photograph } = restaurant;

    if (!photograph) {
      // Currently the API does not return an image for restaurant 10, so let's fix it
      photograph = 10;
    }

    return `/img/${photograph}.jpg`;
  }

  


  /**
   * @description Map marker for a restaurant.
   * @param {string} restaurant
   * @param {string} map
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP
    });
    return marker;
  }
}

