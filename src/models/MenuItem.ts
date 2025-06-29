import { EntitySchema } from 'typeorm';

export interface IMenuItem {
  id?: string;
  title: string;
  description: string;
  calories: number;
  price: number;
  ingredients: string[];
  pictureLinks: string[];
  categoryId: string;
  subCategoryId?: string;
  activeFlag: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

class MenuItem implements IMenuItem {
  id?: string;
  title: string;
  description: string;
  calories: number;
  price: number;
  ingredients: string[] = [];
  pictureLinks: string[] = [];
  categoryId: string;
  subCategoryId?: string;
  activeFlag: boolean = true;
  createdAt?: Date;
  updatedAt?: Date;
}

const MenuItemSchema = new EntitySchema<MenuItem>({
  name: 'MenuItem',
  target: MenuItem,
  columns: {
    id: {
      primary: true,
      type: 'string',
      generated: 'uuid',
    },
    title: {
      type: 'string',
      length: 200,
      nullable: false,
    },
    description: {
      type: 'text',
      nullable: false,
    },
    calories: {
      type: 'int',
      nullable: false,
    },
    price: {
      type: 'decimal',
      precision: 10,
      scale: 2,
      nullable: false,
    },
    ingredients: {
      type: 'simple-array',
      nullable: true,
    },
    pictureLinks: {
      type: 'simple-array',
      nullable: true,
    },
    categoryId: {
      type: 'string',
      nullable: false,
    },
    subCategoryId: {
      type: 'string',
      nullable: true,
    },
    activeFlag: {
      type: 'boolean',
      default: true,
    },
    createdAt: {
      type: 'timestamp',
      createDate: true,
    },
    updatedAt: {
      type: 'timestamp',
      updateDate: true,
    },
  },
  indices: [
    {
      name: 'IDX_MENUITEM_TITLE',
      columns: ['title'],
    },
    {
      name: 'IDX_MENUITEM_CATEGORY',
      columns: ['categoryId'],
    },
    {
      name: 'IDX_MENUITEM_SUBCATEGORY',
      columns: ['subCategoryId'],
    },
    {
      name: 'IDX_MENUITEM_ACTIVE',
      columns: ['activeFlag'],
    },
    {
      name: 'IDX_MENUITEM_PRICE',
      columns: ['price'],
    },
  ],
});

export { MenuItem };
export default MenuItemSchema; 