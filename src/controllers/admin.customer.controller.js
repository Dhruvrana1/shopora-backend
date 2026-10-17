
const user = require("../models/user");


const getAllCustomers = async (req, res) => {
    try {
        const customers = await user.getAllCustomers();

        return res.status(200).json({ customers });
    } catch (error) {
        console.error("Get customers failed:", error);

        return res.status(500).json({
            message: "Failed to fetch customers"
        });
    }
};

const getCustomerById = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "Invalid customer ID"
            });
        }

        const customer = await user.getCustomerById(id);

        if (!customer) {
            return res.status(404).json({
                message: "Customer not found"
            });
        }

        return res.status(200).json({ customer });
    } catch (error) {
        console.error("Get customer details failed:", error);

        return res.status(500).json({
            message: "Failed to fetch customer details"
        });
    }
};

const deleteCustomer = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "Invalid customer ID",
      });
    }

    const customer = await user.deleteCustomer(id);

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      message: "Customer deleted successfully",
      customer,
    });
  } catch (error) {
    console.error("Delete customer error:", error);

    if (error.code === "23503") {
      return res.status(409).json({
        message:
          "This customer has related records. Deactivate the account instead of deleting it.",
      });
    }

    return res.status(500).json({
      message: "Unable to delete customer",
    });
  }
};

const deactivateCustomer = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "Invalid customer ID",
      });
    }

    const customer = await user.deactivateCustomer(id);

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      message: "Customer deactivated successfully",
      customer,
    });
  } catch (error) {
    console.error("Deactivate customer error:", error);

    return res.status(500).json({
      message: "Unable to deactivate customer",
    });
  }
};

module.exports = {
    getAllCustomers,
    getCustomerById,
    deleteCustomer,
    deactivateCustomer
};
