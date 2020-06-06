import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { TileLayer, Map, Marker } from 'react-leaflet'
import { LeafletMouseEvent } from 'leaflet';
import axios from 'axios';

import Dropzone from '../../components/Dropzone';
import api from '../../services/api';


import './styles.css';
import logo from '../../assets/logo.svg';

//Array ou Objeto precisa ter o tipo informado explicitamente

interface Item{
    id: number;
    title: string;
    image_url: string;
}

interface ufIBGE{
    id: number;
    nome: string;
    sigla: string;
}

interface cityIBGE{
    id: number;
    nome: string;
}

const Register = () => {
    //From API
    const [items, setItems] = useState<Item[]>([]);
    const [ufs, setUfs] = useState<ufIBGE[]>([]);
    const [citys, setCitys] = useState<cityIBGE[]>([]);

    //User Data
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        whatsapp: '',
    });
    const [initialPosition, setInitialPosition] = useState<[number, number]>([0, 0]);
    const [coordinates, setCoordinates] = useState<[number, number]>([0, 0]);
    const [selectedUf, setSelectedUf] = useState('0');
    const [selectedCity, setSelectedCity] = useState('0');
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [selectedFile, setSelectedFile] = useState<File>();

    const history = useHistory();

    //Map Initial Position
    useEffect(() => {
        navigator.geolocation.getCurrentPosition(position => {
            let { latitude, longitude } = position.coords;
            setInitialPosition([latitude, longitude]);
        });
    }, []);

    //Get Items from API (Own)
    useEffect(() => {
        api.get('items')
            .then(res => {
                setItems(res.data);
                console.log(res.data);
            });
    }, []);

    //Get UF from API (IBGE)
    useEffect(() => {
        axios.get<ufIBGE[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados')
            .then(res => {
                let ufs = res.data.map(({id, nome, sigla}) => ({id, nome, sigla}));
                setUfs(ufs);
                console.log(ufs);
            });
    }, []);
    
    //Get Citys from API (IBGE)
    useEffect(() => {
        axios.get<cityIBGE[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`)
            .then(res => {
                if(selectedUf === '0'){
                    return;
                }

                let citys = res.data.map(({id, nome}) => ({id, nome}));
                setCitys(citys)
            });
    }, [selectedUf]);
    
    //Choose UF
    function handleChangeUf(e: ChangeEvent<HTMLSelectElement>){
        setSelectedUf(e.target.value);
    }
    
    //Choose City
    function handleChangeCity(e: ChangeEvent<HTMLSelectElement>){
        setSelectedCity(e.target.value);
    }

    //Insert Marker on Map By Click
    function handleMapMarker(e: LeafletMouseEvent) {
        setCoordinates([
            e.latlng.lat,
            e.latlng.lng
        ]);
    }

    //Getting Input Values
    function handleInputChange(e: ChangeEvent<HTMLInputElement>){
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value});
    }

    function handleSelectItem(id: number){
        const alreadySelected = selectedItems.findIndex(item => item === id);

        if(alreadySelected >= 0){
            const filteredItems = selectedItems.filter(item => item !== id);
            setSelectedItems(filteredItems);

        }else{
            setSelectedItems([...selectedItems, id]);
        }
    }

    async function handleSubmit(e: FormEvent){
        e.preventDefault();

        const { name, email, whatsapp } = formData;
        const uf = selectedUf;
        const city = selectedCity;
        const [latitude, longitude] = coordinates;
        const items = selectedItems;

        const data = new FormData();

        data.append('name', name);
        data.append('email', email);
        data.append('whatsapp', whatsapp);
        data.append('uf', uf);
        data.append('city', city);
        data.append('latitude', String(latitude));
        data.append('longitude', String(longitude));
        data.append('items', items.join(','));
        
        if(selectedFile){
            data.append('image', selectedFile)
        }

        console.log(data);

        await api.post('/signup', data);
        
        alert('Ponto de Coleta cadastrado!');

        history.push('/');
    }

    return(
        <div id="page-create-point">
            <header>
                <img src={logo} alt="Ecoleta"/>

                <Link to="/">
                    <FiArrowLeft />
                    Voltar para home
                </Link>
            </header>

            <form onSubmit={handleSubmit}>
                <h1>Cadastro do <br/> ponto de coleta</h1>

                <Dropzone onFileUploaded={setSelectedFile} />

                <fieldset>
                    <legend>
                        <h2>Dados</h2>
                    </legend>

                    <div className="field">
                        <label htmlFor="name">Nome da Entidade</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="email">Email</label>
                            <input 
                                type="email"
                                id="email"
                                name="email"
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="field">
                            <label htmlFor="whatsapp">WhatsApp</label>
                            <input
                                type="text"
                                id="whatsapp"
                                name="whatsapp"
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>
                </fieldset>
                
                <fieldset>
                    <legend>
                        <h2>Endereço</h2>
                        <span>Selecione o Endereço no Mapa</span>
                    </legend>

                    <Map center={initialPosition} zoom={15} onClick={handleMapMarker} >
                        <TileLayer 
                            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <Marker position={coordinates} />
                    </Map>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="uf">Estado</label>
                            <select
                                id="uf"
                                name="uf"
                                value={selectedUf}
                                onChange={ handleChangeUf }
                            >
                            <option value="0">Seleciona uma UF</option>
                                {ufs.map(uf => (
                                    <option key={uf.id} value={uf.sigla}>{uf.nome}</option>
                                ))}
                            </select>
                        </div>

                        <div className="field">
                            <label htmlFor="city">Cidade</label>
                            <select 
                                id="city" 
                                name="city"
                                value={selectedCity}
                                onChange={handleChangeCity}
                            >
                                <option value="0">Selecione uma cidade</option>
                                {citys.map( city => (
                                    <option key={city.id} value={city.nome}>{city.nome}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Itens de Coleta</h2>
                        <span>Selecione um ou mais itens abaixo</span>
                    </legend>

                    <ul className="items-grid">
                        
                        {items.map(item => (
                            <li
                            key={item.id}
                            onClick={ () => handleSelectItem(item.id) }
                            className={selectedItems.includes(item.id) ? 'selected' : ''}
                            >
                                <img src={item.image_url} alt={item.title} />
                                <span>{item.title}</span>
                            </li>
                        ))}
                    </ul>
                </fieldset>

                <button type="submit">Cadastrar Ponto de Coleta</button>
            </form>
        </div>
    );
}

export default Register;