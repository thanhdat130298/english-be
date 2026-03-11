import { PartialType } from '@nestjs/swagger';
import { CreateWordlistDto } from './create-wordlist.dto';

export class UpdateWordlistDto extends PartialType(CreateWordlistDto) {}
