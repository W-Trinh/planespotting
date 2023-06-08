function collect_espaces_verts() {
    fetch('https://data.toulouse-metropole.fr/api/records/1.0/search/?dataset=espaces-verts&rows=3931&q=ENA')
            .then(res => res.json())
            .then(data => {
                data.records.forEach(record => {
                const shape = record.fields.geo_shape;
                const fields = record.fields;
                const popupContent = `<strong>${fields.nom}</strong><br>Type: ${fields.type}<br>Surface: ${fields.surface_m2} m²`;
                L.geoJson(shape, {
                style: {
                    fillColor: 'green', 
                    fillOpacity: 0.5,    
                    color: 'black',     
                    weight: 1            
                }
            }).bindPopup(popupContent).addTo(map);
            });
            console.log(data)
        });

    fetch('https://data.toulouse-metropole.fr/api/records/1.0/search/?dataset=espaces-verts&rows=3931&q=PJS')
        .then(res => res.json())
        .then(data => {
            data.records.forEach(record => {
            const shape = record.fields.geo_shape;
            const fields = record.fields;
            const popupContent = `<strong>${fields.nom}</strong><br>Type: ${fields.type}<br>Surface: ${fields.surface_m2} m²`;

            L.geoJson(shape, {
            style: {
                fillColor: 'green',  
                fillOpacity: 0.5,    
                color: 'black',      
                weight: 1           
            }
        }).bindPopup(popupContent).addTo(map);
        });
        console.log(data)
});
}