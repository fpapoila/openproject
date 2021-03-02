import {
  Component,
  Input,
  EventEmitter,
  Output,
  ElementRef,
} from '@angular/core';
import {I18nService} from "core-app/modules/common/i18n/i18n.service";
import {APIV3Service} from "core-app/modules/apiv3/api-v3.service";
import {PrincipalType} from '../invite-user.component';
import {RoleResource} from "core-app/modules/hal/resources/role-resource";
import {PrincipalLike} from "core-app/modules/invite-user-modal/invite-user-modal.types";
import {HalResource} from "core-app/modules/hal/resources/hal-resource";
import {Observable, of} from "rxjs";
import {map, mapTo, switchMap} from "rxjs/operators";
import {propertyNames} from "@angular/cdk/schematics";

@Component({
  selector: 'op-ium-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.sass'],
})
export class SummaryComponent {
  @Input() type:PrincipalType;
  @Input() project:any = null;
  @Input() role:RoleResource;
  @Input() principal:PrincipalLike;
  @Input() message:string = '';

  @Output() close = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();
  @Output() save = new EventEmitter();

  public text = {
    title: () => this.I18n.t('js.invite_user_modal.title.invite_principal_to_project', {
      principal: this.principal?.name,
      project: this.project?.name,
    }),
    projectLabel: this.I18n.t('js.invite_user_modal.project.label'),
    principalLabel: {
      user: this.I18n.t('js.invite_user_modal.principal.label.name_or_email'),
      placeholder: this.I18n.t('js.invite_user_modal.principal.label.name'),
      group: this.I18n.t('js.invite_user_modal.principal.label.name'),
    },
    roleLabel: () => this.I18n.t('js.invite_user_modal.role.label', {
      project: this.project?.name,
    }),
    messageLabel: this.I18n.t('js.invite_user_modal.message.label'),
    backButton: this.I18n.t('js.invite_user_modal.back'),
    nextButton: () => this.I18n.t('js.invite_user_modal.summary.next_button', {
      type: this.type,
      principal: this.principal,
    }),
  };

  constructor(
    readonly I18n:I18nService,
    readonly elementRef:ElementRef,
    readonly api:APIV3Service,
  ) {
  }

  invite() {
    return of(this.principal)
      .pipe(
        switchMap((principal:PrincipalLike) => this.createPrincipal(principal)),
        switchMap((principal:HalResource) =>
          this.api.memberships
            .post({
              principal,
              project: this.project,
              roles: [this.role],
            })
            .pipe(
              mapTo(principal)
            )
        )
      );
  }

  private createPrincipal(principal:PrincipalLike):Observable<HalResource> {
    if (principal instanceof HalResource) {
      return of(principal);
    }

    switch (this.type) {
      case PrincipalType.User:
        return this.api.users.post({
          email: principal.name,
          status: 'invited',
        });
      case PrincipalType.Placeholder:
        return this.api.placeholder_users.post({ name: principal.name });
      default:
        throw new Error("Unsupported PrincipalType given");
    }
  }

  onSubmit($e:Event) {
    $e.preventDefault();

    this
      .invite()
      .subscribe(principal =>
        this.save.emit({ principal: principal })
      );
  }
}
