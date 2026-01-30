const db = require('../db');

const universityImages = {
    'Arizona State University': 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&q=80',
    'Harvard University': 'https://images.unsplash.com/photo-1559135197-8a45ea74d367?w=600&q=80',
    'MIT': 'https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=600&q=80',
    'Stanford University': 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=600&q=80',
    'University of Melbourne': 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&q=80',
    'University of Waterloo': 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=600&q=80',
    'University of Toronto': 'https://images.unsplash.com/photo-1569447891824-7a1758aa73a2?w=600&q=80',
    'Trinity College Dublin': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
    'National University of Singapore': 'https://images.unsplash.com/photo-1562774053-701939374585?w=600&q=80',
    'Seoul National University': 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=600&q=80',
    'ETH Zurich': 'https://images.unsplash.com/photo-1572375992501-4b0892d50c69?w=600&q=80',
    'Delft University of Technology': 'https://images.unsplash.com/photo-1562774053-701939374585?w=600&q=80',
    'University of Auckland': 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&q=80',
    'University of British Columbia': 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&q=80',
    'Technical University of Munich': 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&q=80',
    'University of Sydney': 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&q=80',
    'Imperial College London': 'https://images.unsplash.com/photo-1526129318478-62ed807ebdf9?w=600&q=80'
};

async function updateImages() {
    console.log('Starting image update...');
    for (const [name, imageUrl] of Object.entries(universityImages)) {
        try {
            const result = await db.query(
                `UPDATE shortlists SET university_data = university_data || $1::jsonb WHERE university_name = $2 RETURNING id`,
                [JSON.stringify({ image_url: imageUrl }), name]
            );
            if (result.rowCount > 0) {
                console.log('Updated:', name, '-', result.rowCount, 'rows');
            }
        } catch (err) {
            console.error('Error updating', name, ':', err.message);
        }
    }
    console.log('Done!');
    process.exit(0);
}

updateImages();
