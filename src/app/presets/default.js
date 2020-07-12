export default function base() {
    return {
        spacing: {
            xs: 4,
            sm: 8,
            md: 16,
            lg: 32,
            xl: 96,
        },
        sizing: {
            xs: 4,
            sm: 8,
            md: 16,
            lg: 32,
            xl: 96,
        },
        borderRadius: {
            sm: 4,
            lg: 8,
            xl: 16,
        },
        colors: {
            primary: '#18A0FB',
            indigo: '#5c6ac4',
            blue: '#007ace',
            red: '#de3618',
            grey: {
                100: '#f5f5f5',
                200: '#eeeeee',
                300: '#e0e0e0',
                400: '#bdbdbd',
                500: '#9e9e9e',
                600: '#757575',
                700: '#616161',
                800: '#424242',
                900: '#212121',
            },
        },
        opacity: {
            low: '10%',
            md: '50%',
            high: '90%',
        },
    };
}
