import { Request, Response, response } from 'express';
import knex from '../database/connection';
import Serialization from '../utils/serialization';

class PointsController {
    async index(req: Request, res: Response) {
        const { city, uf, items } = req.query;

        const parsedItems = String(items)
                                .split(',')
                                .map(item => Number(item.trim()));

        const points = await knex('points')
            .join('point_items', 'points.id', '=', 'point_items.point_id')
            .whereIn('point_items.item_id', parsedItems)
            .where('city', String(city))
            .where('uf', String(uf))
            .distinct()
            .select('points.*');

        const serializedPoints = Serialization.imageUrlInPoints(points);
        
        return res.json(serializedPoints);
    }
    
    async show(req: Request, res: Response) {
        const { id } = req.params;
        
        let point = await knex('points').where('id', id).first();
        
        if (!point){
            return res.status(400).json({ message: 'Point not found.'});
        }
        
        const items  = await knex('items')
        .join('point_items', 'items.id', '=', 'point_items.item_id')
        .where('point_items.point_id', id)
        .select('items.title');
        
        const [ serializedPoint ] = Serialization.imageUrlInPoints([point]);

        point = { ...serializedPoint, items};
        
        return res.json({ point });
    }
    
    async create(req: Request, res: Response) {
        const { items, ...point } = req.body;

        point['image'] = req.file.filename;

        const {
            name,
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            uf
        } = point;
    
        const trx = await knex.transaction();
    
        const [point_id] = await trx('points').insert(point);
    
        const pointItems = items.split(',')
                                .map((item: string) => Number(item.trim()))
                                .map( (item_id: number) => {
                                    return {
                                        item_id,
                                        point_id
                                    }
                                });
    
        await trx('point_items').insert(pointItems);
    
        await trx.commit();
    
        console.log('cadastrado');

        return res.json({ id: point_id, ...point, items: pointItems});
    }
}

export default PointsController;