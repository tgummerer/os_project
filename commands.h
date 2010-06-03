/**
 * @name        : commands.h
 * @author      : Thomas Gummerer
 * @version     : 0.1
 * @description : The main program
 * @copyright   : Copyright (c) Thomas Gummerer 2010 | All rights reserved.
 * @license     : GPL
 */
#ifndef __COMMANDS_H__
#define __COMMANDS_H__

void internal (char command[]);

void background (char command[]);
void foreground (char command[]);
void in (char command[]);
void out (char command[]);

#endif
