import { Component, OnInit, ViewChild } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { routes } from '../../app-routing.module';
import { Title } from '@angular/platform-browser';
import { MatDrawer } from '@angular/material/sidenav';
import { Router, RouterOutlet } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { EdcInfoDialogComponent } from 'src/modules/edc-demo/components/edc-info-dialog/edc-info-dialog.component';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent{

  @ViewChild("drawer") drawer: MatDrawer | undefined;

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  routes = routes;
  panelOpenState = false;
  consumerRoutes:any[]=[];
  providerRoutes:any[] =[];
  dashboardRoute:any;

  constructor(
    public titleService: Title,
    private breakpointObserver: BreakpointObserver, private router: Router, public dialog:MatDialog) {
      routes.slice(0,-1).forEach((route:any)=>{
        if (route?.path === "dashboard"){
          this.dashboardRoute = route;
        }else if(route?.data?.isConsumerMode){
          this.consumerRoutes.push(route);
        }else{
          this.providerRoutes.push(route)
        }
      })

      router.events.subscribe(()=>{
        if(this.drawer?.opened){
          this.drawer.close();
        }
      })

  }

  openEdcInfoDialog(){
    this.dialog.open(EdcInfoDialogComponent)
  }


}
