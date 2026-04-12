import { PartialType } from '@nestjs/swagger';
import { CreateCarsCategoryDto } from './create-cars-category.dto';

export class UpdateCarsCategoryDto extends PartialType(CreateCarsCategoryDto) {}
