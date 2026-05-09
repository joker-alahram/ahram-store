export async function loadRuntimeProducts(api) {
  const [runtime, catalogProducts, companies] = await Promise.allSettled([
    api.get('v_runtime_products', { select: 'product_id,product_name,unit_code,tier_name,final_price,available_qty,reserved_qty,allow_backorder,runtime_healthy', order: 'product_id.asc' }),
    api.get('catalog_products', { select: 'product_id,product_name,company_id,product_image,visible,status', visible: 'eq.true', status: 'eq.active', order: 'product_id.asc' }),
    api.get('companies', { select: 'company_id,company_name,company_logo,visible', visible: 'eq.true', order: 'company_name.asc' }),
  ]);

  return {
    runtimeRows: runtime.status === 'fulfilled' && Array.isArray(runtime.value) ? runtime.value : [],
    catalogProducts: catalogProducts.status === 'fulfilled' && Array.isArray(catalogProducts.value) ? catalogProducts.value : [],
    companies: companies.status === 'fulfilled' && Array.isArray(companies.value) ? companies.value : [],
  };
}
