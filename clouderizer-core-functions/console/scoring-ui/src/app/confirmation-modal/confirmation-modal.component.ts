import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-confirmation-modal',
  templateUrl: './confirmation-modal.component.html',
  styleUrls: ['./confirmation-modal.component.scss']
})
export class ConfirmationModalComponent implements OnInit {
  closeModal(action) {
		this.activeModal.close(action);
	}
  constructor( public activeModal: NgbActiveModal) { }
  ngOnInit() {
  }

}
