import { EntitySchema } from 'typeorm';

export interface ICategory {
  id?: string;
  title: string;
  createdAt?: Date;
  updatedAt?: Date;
  activeFlag: boolean;
}

class Category implements ICategory {
  id?: string;
  title: string;
  createdAt?: Date;
  updatedAt?: Date;
  activeFlag: boolean = true;
}

const CategorySchema = new EntitySchema<Category>({
  name: 'Category',
  target: Category,
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
      name: 'IDX_CATEGORY_TITLE',
      columns: ['title'],
      unique: true,
    },
    {
      name: 'IDX_CATEGORY_ACTIVE',
      columns: ['activeFlag'],
    },
  ],
});

export { Category };
export default CategorySchema; 