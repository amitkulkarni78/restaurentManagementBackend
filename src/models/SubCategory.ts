import { EntitySchema } from 'typeorm';

export interface ISubCategory {
  id?: string;
  title: string;
  categoryId: string;
  createdAt?: Date;
  updatedAt?: Date;
  activeFlag: boolean;
}

class SubCategory implements ISubCategory {
  id?: string;
  title: string;
  categoryId: string;
  createdAt?: Date;
  updatedAt?: Date;
  activeFlag: boolean = true;
}

const SubCategorySchema = new EntitySchema<SubCategory>({
  name: 'SubCategory',
  target: SubCategory,
  columns: {
    id: {
      primary: true,
      type: 'string',
      generated: 'uuid',
    },
    title: {
      type: 'string',
      length: 100,
      nullable: false,
    },
    categoryId: {
      type: 'string',
      nullable: false,
    },
    createdAt: {
      type: 'timestamp',
      createDate: true,
    },
    updatedAt: {
      type: 'timestamp',
      updateDate: true,
    },
    activeFlag: {
      type: 'boolean',
      default: true,
    },
  },
  indices: [
    {
      name: 'IDX_SUBCATEGORY_TITLE',
      columns: ['title'],
    },
    {
      name: 'IDX_SUBCATEGORY_CATEGORY',
      columns: ['categoryId'],
    },
    {
      name: 'IDX_SUBCATEGORY_ACTIVE',
      columns: ['activeFlag'],
    },
    {
      name: 'IDX_SUBCATEGORY_TITLE_CATEGORY',
      columns: ['title', 'categoryId'],
      unique: true,
    },
  ],
});

export { SubCategory };
export default SubCategorySchema; 