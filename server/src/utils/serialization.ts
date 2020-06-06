interface Point {
    id: number;
    image: string;
    name: string;
    email: string;
    whatsapp: string;
    latitude: number;
    longitude: number;
    city: string;
    uf: string;
}

function imageUrlInPoints(points: Point[]) {
    return (
        points.map(point => {
            return {
                ...point,
                image_url: `http://192.168.1.99:3333/uploads/${point.image}`
            }
        }));
}

export default { imageUrlInPoints };