import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'errorModal',
  templateUrl: './errorModal.component.html',
  styleUrls: ['./errorModal.component.css']
})
export class errorModal implements OnInit {
  closeModal(action) {
		this.activeModal.close(action);
  }
  @Input() message;

  constructor(
    public activeModal: NgbActiveModal,
  ) {}

  ngOnInit() {}
}

  