/**
 * @name        : sighandlers.h
 * @author      : Thomas Gummerer
 * @version     : 0.1
 * @description : The main program
 * @copyright   : Copyright (c) Thomas Gummerer 2010 | All rights reserved.
 * @license     : GPL
 */
#ifndef __SIGHANDLERS_H__
#define __SIGHANDLERS_H__

void sighandlers(void);
void sigint_handler (int sig);
void sigtstp_handler (int sig);

#endif
