import axiosClient from "../api";

const DEALS_BASE_URL = "/api/customerprofile";

export const dealsService = {
  async getDealProducts() {
    const response = await axiosClient.get(`${DEALS_BASE_URL}/deal-products`);
    if (!Array.isArray(response.data)) {
      throw new Error("The deals service returned an invalid response.");
    }
    return response.data;
  },

  async getFlashSales() {
    const response = await axiosClient.get(`${DEALS_BASE_URL}/flash-sales`);
    if (!Array.isArray(response.data)) {
      throw new Error("The flash sales service returned an invalid response.");
    }
    return response.data;
  },

  async getHomeDealData() {
    const [deals, flashSales] = await Promise.all([
      this.getDealProducts(),
      this.getFlashSales(),
    ]);
    return { deals, flashSales };
  },
};

export default dealsService;
