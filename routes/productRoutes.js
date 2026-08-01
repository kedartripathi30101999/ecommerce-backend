const express= require('express')
const router= express.Router()

const {addProduct, getAllProducts, getProductById, updateProduct, deleteProduct}= require('../controllers/productController')

const {protect, authorize}= require('../middleware/authMiddleware')

const upload= require('../middleware/uploadMiddleware')

//* Fetch Products
router.get('/',getAllProducts)

//* Fetch individual Product
router.get('/:id',getProductById)

//* Add Product
router.post('/',
            protect,
            authorize('admin'),
            upload.single('image'),
            addProduct
        )

//* Update Product
router.put('/:id',
            protect,
            authorize('admin'),
            upload.single('image'),
            updateProduct
)


//* Delete Product
router.delete('/:id',
               protect,
               authorize('admin'),
               deleteProduct
)

module.exports= router