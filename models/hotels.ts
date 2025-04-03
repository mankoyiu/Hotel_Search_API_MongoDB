interface Hotel {
    star: number,
    name: string,
    accommodationType: string,
    address:  string,
    city: string,
    coordinates: {
        latitude: number,
        longitude: number,
    },
    country: string,
    description: string,
    email: string,
    facilities: string[],
    lastUpdate?: string,
    phones?:  string,
    ranking: number,
    web: string
}

export const sampleHotels: Hotel[] = [
    {
        star: 5,
        name: "Four Seasons Hotel Hong Kong",
        accommodationType: "Hotel",
        address:  "8 Finance Street, Central",
        city: "Hong Kong",
        coordinates: {
            latitude: 22.2863701,
            longitude: 114.0849434,
        },
        country: "Hong Kong, China",
        description: "Luxe harbour-view hotel with a pool",
        email: "info@fourseasons.com",
        facilities: ["Pool", "Spa", "Free WiFi", "Air-conditioned"],
        lastUpdate: "2025-03-15",
        phones:  "(852)-3196-8888",
        ranking: 5,
        web: "www.fourseasons.com"
    },
    {
        star: 3,
        name: "Four Seasons Hostel",
        accommodationType: "Hostel",
        address:  "Chungking Mansions, Tsim Sha Tsui",
        city: "Hong Kong",
        coordinates: {
            latitude: 22.2965615,
            longitude: 114.1363835,
        },
        country: "Hong Kong, China",
        description: "Ideally set in the Yau Tsim Mong District",
        email: "info@hkwm.com",
        facilities: ["Free WiFi", "Air-conditioned"],
        lastUpdate: "2025-03-15",
        ranking: 2,
        web: "www.hkwm.com"
    }
];
