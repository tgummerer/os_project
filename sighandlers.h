#ifndef __SIGHANDLERS_H__
#define __SIGHANDLERS_H__

void sighandlers(void);
void sigint_handler (int sig);
void sigstop_handler (int sig);

#endif
