/**
 * @name        : child.h
 * @author      : Thomas Gummerer
 * @version     : 0.1
 * @copyright   : Copyright (c) Thomas Gummerer 2010 | All rights reserved.
 * @license     : GPL
 */
#ifndef __CHILD_H__
#define __CHILD_H__

#include "def.h"

int child (char command []);
void explode_string (char command[], char exploded[2][MAX_COMMAND_LENGTH]);

#endif


