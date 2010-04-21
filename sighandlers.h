#ifndef __SIGHANDLERS_H__
#define __SIGHANDLERS_H__

void sighandlers(void);
void sigint_handler (int sig);
void sigtstp_handler (int sig);

#endif
