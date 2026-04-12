import { PartialType } from '@nestjs/mapped-types';
import { CreateStatsCacheDto } from './create-stats-cache.dto';

export class UpdateStatsCacheDto extends PartialType(CreateStatsCacheDto) {}
