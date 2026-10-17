const category = require("../models/category")
const { uploadImage } = require("../config/storage");

const categoryCreation = async (req,res) => {
    
    try {
        
        const {parent_id,name,slug,description,image,meta_title,meta_description,status,sort_order} = req.body

        if(!name || !slug){
            return res.status(400).json({
                message:"category name and slug is required"
            })
        }

        const Category = await category.createCategory(parent_id,name,slug,description,image,meta_title,meta_description,status,sort_order);

        return res.status(201).json({
            message:"category creation successfull"
        })

    } catch (error) {
        console.error("Category creation failed",error)

        return res.status(500).json({
            message:"internal server error"
        })
    }

}

const getCategories = async (req,res) => {
    
    try {
        
        const Category = await category.getCategory()

        return res.status(200).json({
            Category
        })

    } catch (error) {
        console.error("Failed in getting categories",error)

        return res.status(500).json({
            message:"internal server error"
        })
    }

}

const getCategoryById = async (req,res) => {
    try{
    const {id} = req.params

    const Category = await category.getCategoryById(id)

    if(!Category){
        return res.status(404).json({
            message:"category not found"
        })
    }

    return res.status(200).json({
        Category
    })
    }
    catch(error){
        console.error("Failed in getting category",error)
        return res.status(500).json({
            message:"internal server error"
        })
    }
}

const updateCategory = async (req,res) => {
    
    try {
        
        const {id} = req.params

        const {parent_id,name,slug,description,image,meta_title,meta_description,status,sort_order} = req.body

        if(!name || !slug){
            return res.status(400).json({
                message:"category name and slug is required"
            })
        }

        const Category = await category.updateCategory(parent_id,name,slug,description,image,meta_title,meta_description,status,sort_order,id)

        if(!Category){
            return res.status(404).json({
                message:"category not found"
            })
        }

        return res.status(200).json({
            message:"Category updated successfully",
            Category
        })

    } catch (error) {
        console.error("failed to update the category",error)

        return res.status(500).json({
            message:"internal server error"
        })
    }

}

const deleteCategory = async (req,res) => {
    
    try {
        
        const {id} = req.params

        const Category = await category.deleteCategory(id)

        if(!Category){
            return res.status(400).json({
                message:"category not found"
            })
        }

        return res.status(200).json({
            message:"category deleted successfully"
        })

    } catch (error) {
        console.error("Error in deleting category",error)

        return res.status(500).json({
            message:"internal server error"
        })
    }

}

const getCustomerCategories = async (req,res) => {
    
    try {
        
        const categories = await category.getCategory()
        return res.status(200).json({
            categories
        })

    } catch (error) {
        console.error("Failed in getting customer categories",error)

        return res.status(500).json({
            message:"internal server error"
        })
    }

}

const getCategoryBySlug = async (req,res) => {
    
    try {
        
        const {slug} = req.params

        const categorySlug = await category.getCategoryBySlug(slug)

        if(!categorySlug){
            return res.status(404).json({
                message:"category not found"
            })
        }

        return res.status(200).json({
            category:categorySlug
        })

    } catch (error) {
        console.error("Get Category by slug error",error)

        return res.status(500).json({
            message:"internal server error"
        })
    }

}

const getProductsCategoryBySlug = async (req,res) => {
    
    try {
        
        const {slug} = req.params

        const products = await category.getProductsByCategorySlug(slug)

        return res.status(200).json({
            products
        })

    } catch (error) {
        console.error("error in getting the products",error)
        return res.status(500).json({
            message:"internal server error"
        })
    }
}

const uploadCategoryImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please select an image to upload",
      });
    }

    const imageUrl = await uploadImage(req.file.path);

    return res.status(200).json({
      message: "Category image uploaded successfully",
      image: imageUrl,
    });
  } catch (error) {
    console.error("Category image upload failed:", error);

    return res.status(500).json({
      message: "Failed to upload category image",
    });
  }
};

module.exports = {
    categoryCreation,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
    getCustomerCategories,
    getCategoryBySlug,
    getProductsCategoryBySlug,
    uploadCategoryImage
}