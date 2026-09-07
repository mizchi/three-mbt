export const gLTFLoaderPlugin=name=>{
 if(!name)throw new TypeError('An extension name is required');
 return {name};
};
export const gLTFExporterPlugin=()=>({});
